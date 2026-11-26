// KIKI Bot - Railway Deployment, Health & Safe Rollback Integration
// Preserves all env variables, NEVER deletes services/projects, and NEVER exposes Railway/Discord tokens.

const axios = require('axios');
const DevAccess = require('./devAccess.js');
const DevSecrets = require('./devSecrets.js');
const ActivityLogger = require('./activityLogger.js');

const RAILWAY_GQL = 'https://backboard.railway.app/graphql/v2';
const errorBuffer = [];

function recordRuntimeError(source, err) {
  const raw = err?.stack || err?.message || String(err || '');
  errorBuffer.unshift({
    timestamp: new Date().toISOString(),
    source: String(source || 'runtime'),
    message: DevSecrets.redactSecrets(raw).slice(0, 1000)
  });
  if (errorBuffer.length > 40) errorBuffer.length = 40;
}

function getRuntimeErrors(limit = 20) {
  return errorBuffer.slice(0, limit);
}

function getCredentials() {
  const token = DevAccess.getSecretFromEnvOrVault('RAILWAY_API_TOKEN', 'railwayTokenEnc') || process.env.RAILWAY_TOKEN || null;
  const projectId = DevAccess.getPlainFromEnvOrVault('RAILWAY_PROJECT_ID', 'railwayProjectId');
  const serviceId = DevAccess.getPlainFromEnvOrVault('RAILWAY_SERVICE_ID', 'railwayServiceId');
  const environmentId = DevAccess.getPlainFromEnvOrVault('RAILWAY_ENVIRONMENT_ID', 'railwayEnvironmentId');
  return { token, projectId, serviceId, environmentId };
}

async function gqlRequest(token, query, variables = {}) {
  const res = await axios.post(
    RAILWAY_GQL,
    { query, variables },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 12000
    }
  );
  if (res.data?.errors?.length) {
    throw new Error(res.data.errors.map(e => e.message).join('; '));
  }
  return res.data?.data;
}

const RailwayIntegration = {
  recordRuntimeError,
  getRuntimeErrors,

  getConfigSummary() {
    const creds = getCredentials();
    return {
      configured: Boolean(creds.token && creds.serviceId && creds.environmentId),
      hasToken: Boolean(creds.token),
      hasProjectId: Boolean(creds.projectId),
      hasServiceId: Boolean(creds.serviceId),
      hasEnvironmentId: Boolean(creds.environmentId),
      runtimePlatform: process.env.RAILWAY_ENVIRONMENT_NAME || (process.env.RAILWAY_SERVICE_NAME ? 'railway' : 'local'),
      serviceName: process.env.RAILWAY_SERVICE_NAME || 'kiki-bot',
      currentDeploymentId: process.env.RAILWAY_DEPLOYMENT_ID || null,
      currentCommitSha: process.env.RAILWAY_GIT_COMMIT_SHA || null
    };
  },

  getBotLiveHealth(client) {
    return {
      ready: Boolean(client && client.isReady?.()),
      botTag: client?.user?.tag || 'KIKI',
      wsPingMs: client?.ws?.ping ?? -1,
      guildCount: client?.guilds?.cache?.size || 0,
      uptimeSec: Math.floor(process.uptime()),
      commandsLoaded: client?.totalCommands || 0,
      memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      recentErrors: getRuntimeErrors(10)
    };
  },

  async getDeployments(limit = 6) {
    const summary = this.getConfigSummary();
    const creds = getCredentials();
    if (!creds.token || !creds.serviceId || !creds.environmentId) {
      return {
        ...summary,
        deployments: [],
        note: 'Set RAILWAY_API_TOKEN, RAILWAY_PROJECT_ID, RAILWAY_SERVICE_ID, and RAILWAY_ENVIRONMENT_ID to inspect & trigger Railway deployments.'
      };
    }

    try {
      const data = await gqlRequest(
        creds.token,
        `query($input: DeploymentListInput!, $first: Int) {
          deployments(input: $input, first: $first) {
            edges {
              node {
                id
                status
                createdAt
                staticUrl
                meta
              }
            }
          }
        }`,
        {
          input: {
            serviceId: creds.serviceId,
            environmentId: creds.environmentId
          },
          first: limit
        }
      );

      const list = (data?.deployments?.edges || []).map(e => ({
        id: e.node.id,
        status: e.node.status,
        createdAt: e.node.createdAt,
        commitSha: e.node.meta?.commitHash || e.node.meta?.commitSha || null,
        commitMessage: e.node.meta?.commitMessage || null
      }));

      return { ...summary, deployments: list };
    } catch (err) {
      return { ...summary, deployments: [], error: DevSecrets.redactSecrets(err.message) };
    }
  },

  // Trigger redeploy of existing service (env vars untouched, zero delete permissions)
  async triggerRedeploy(actor) {
    const creds = getCredentials();
    if (!creds.token || !creds.serviceId || !creds.environmentId) {
      return { success: false, error: 'Railway API credentials not configured (RAILWAY_API_TOKEN, RAILWAY_SERVICE_ID, RAILWAY_ENVIRONMENT_ID).' };
    }

    try {
      await gqlRequest(
        creds.token,
        `mutation($environmentId: String!, $serviceId: String!) {
          serviceInstanceRedeploy(environmentId: $environmentId, serviceId: $serviceId)
        }`,
        { environmentId: creds.environmentId, serviceId: creds.serviceId }
      );

      ActivityLogger.record({
        actorRole: actor?.role || 'system',
        actorId: actor?.discordId || null,
        actorTag: actor?.discordTag || 'System',
        action: 'RAILWAY_DEPLOY_TRIGGERED',
        summary: 'Triggered Railway serviceInstanceRedeploy on existing service.',
        railway: { serviceId: creds.serviceId, environmentId: creds.environmentId, status: 'DEPLOYING' }
      });

      return { success: true, message: 'Railway redeploy triggered cleanly on existing service (environment variables preserved).' };
    } catch (err) {
      return { success: false, error: DevSecrets.redactSecrets(err.message) };
    }
  },

  // Roll back to a previous working SUCCESS deployment (Owner only)
  async rollbackDeployment(ownerUserId, deploymentId) {
    if (!DevAccess.isSoleOwner(ownerUserId)) {
      return { success: false, error: 'Only the Sole Owner can execute a Railway deployment rollback.' };
    }
    const creds = getCredentials();
    if (!creds.token || !deploymentId) {
      return { success: false, error: 'Missing Railway API token or deployment ID.' };
    }

    try {
      await gqlRequest(
        creds.token,
        `mutation($id: String!) {
          deploymentRollback(id: $id)
        }`,
        { id: String(deploymentId) }
      );

      ActivityLogger.record({
        actorRole: 'owner',
        actorId: String(ownerUserId),
        actorTag: 'Sole Owner',
        action: 'RAILWAY_ROLLBACK',
        summary: `Rolled back Railway service to deployment ${deploymentId}.`,
        railway: { deploymentId: String(deploymentId), status: 'ROLLBACK_TRIGGERED' }
      });

      return { success: true, deploymentId };
    } catch (err) {
      return { success: false, error: DevSecrets.redactSecrets(err.message) };
    }
  }
};

module.exports = RailwayIntegration;
