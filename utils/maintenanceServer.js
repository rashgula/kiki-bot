// KIKI Bot - Authenticated Maintenance Dashboard & API Server
// Preserves health checks on / and /health while securing /dev, /api/dev/*, and /api/owner/* behind verified sessions.

const fs = require('fs');
const path = require('path');
const http = require('http');
const { URL } = require('url');
const chalk = require('chalk');
const DevAccess = require('./devAccess.js');
const DevPolicy = require('./devPolicy.js');
const DevTests = require('./devTests.js');
const DevAi = require('./devAi.js');
const GitHubIntegration = require('./githubIntegration.js');
const RailwayIntegration = require('./railwayIntegration.js');
const ActivityLogger = require('./activityLogger.js');

const COOKIE_NAME = 'kiki_dev_sess';
const RATE_BUCKET = new Map();

function isRateLimited(ip, limit = 25, windowMs = 60000) {
  const now = Date.now();
  const key = String(ip || 'unknown');
  const rec = RATE_BUCKET.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > rec.resetAt) {
    rec.count = 0;
    rec.resetAt = now + windowMs;
  }
  rec.count++;
  RATE_BUCKET.set(key, rec);
  return rec.count > limit;
}

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.socket?.remoteAddress || '127.0.0.1';
}

function parseCookies(req) {
  const raw = req.headers.cookie || '';
  const out = {};
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const k = part.slice(0, idx).trim();
      const v = decodeURIComponent(part.slice(idx + 1).trim());
      out[k] = v;
    }
  }
  return out;
}

function readJsonBody(req, maxBytes = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks = [];
    req.on('data', chunk => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error('Request payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8').trim();
        resolve(text ? JSON.parse(text) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, data, extraHeaders = {}) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    ...extraHeaders
  });
  res.end(body);
}

function buildSetCookie(req, value, maxAgeSec) {
  const isHttps = String(req.headers['x-forwarded-proto'] || '').toLowerCase().includes('https') || Boolean(process.env.RAILWAY_PUBLIC_DOMAIN);
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSec}`
  ];
  if (isHttps) parts.push('Secure');
  return parts.join('; ');
}

function buildClearCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

async function handleRequest(req, res, client) {
  const reqUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname;
  const method = (req.method || 'GET').toUpperCase();
  const ip = getClientIp(req);

  // ── 1. Health Checks (Railway uptime monitor) ────────────────────
  if (method === 'GET' && (pathname === '/' || pathname === '/health')) {
    return sendJson(res, 200, {
      status: 'ok',
      bot: 'KIKI',
      ready: Boolean(client?.isReady?.()),
      uptime: Math.floor(process.uptime())
    });
  }

  // ── 2. Maintenance Portal HTML ───────────────────────────────────
  if (method === 'GET' && (pathname === '/dev' || pathname === '/dev/')) {
    const htmlPath = path.join(__dirname, '..', 'public', 'dev-portal.html');
    if (!fs.existsSync(htmlPath)) return sendJson(res, 404, { error: 'Portal UI missing' });
    const html = fs.readFileSync(htmlPath, 'utf8');
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff'
    });
    return res.end(html);
  }

  // ── 3. Public Auth Endpoints (Rate Limited) ──────────────────────
  if (pathname.startsWith('/api/auth/')) {
    if (isRateLimited(ip, 30, 60000)) {
      return sendJson(res, 429, { error: 'Too many authentication attempts. Wait a minute.' });
    }

    if (method === 'GET' && pathname === '/api/auth/invite/info') {
      const token = reqUrl.searchParams.get('token') || '';
      const check = DevAccess.validatePendingInvite(token);
      if (!check.valid) return sendJson(res, 200, { valid: false, reason: check.reason, hasOAuth: DevAccess.hasOAuthConfigured() });
      const tid = check.invite.targetDiscordId;
      const maskedId = `${tid.slice(0, 4)}••••${tid.slice(-4)}`;
      return sendJson(res, 200, {
        valid: true,
        maskedTargetId: maskedId,
        targetTag: check.invite.targetTag || maskedId,
        expiresAt: check.invite.expiresAt,
        hasOAuth: DevAccess.hasOAuthConfigured()
      });
    }

    if (method === 'POST' && pathname === '/api/auth/invite/send-otp') {
      const body = await readJsonBody(req);
      const out = await DevAccess.sendInviteDmOtp(client, body.token, body.discordId);
      return sendJson(res, out.success ? 200 : 400, out);
    }

    if (method === 'POST' && pathname === '/api/auth/invite/verify-otp') {
      const body = await readJsonBody(req);
      const out = await DevAccess.verifyInviteDmOtp(client, body.token, body.discordId, body.otp);
      if (!out.success) return sendJson(res, 401, out);
      return sendJson(res, 200, {
        success: true,
        role: out.role,
        discordId: out.discordId,
        discordTag: out.discordTag
      }, { 'Set-Cookie': buildSetCookie(req, out.cookieValue, out.maxAgeSec) });
    }

    if (method === 'POST' && pathname === '/api/auth/owner/send-otp') {
      const body = await readJsonBody(req);
      const out = await DevAccess.sendOwnerDmOtp(client, body.discordId);
      return sendJson(res, out.success ? 200 : 403, out);
    }

    if (method === 'POST' && pathname === '/api/auth/owner/verify-otp') {
      const body = await readJsonBody(req);
      const out = await DevAccess.verifyOwnerDmOtp(client, body.discordId, body.otp);
      if (!out.success) return sendJson(res, 401, out);
      return sendJson(res, 200, {
        success: true,
        role: out.role,
        discordId: out.discordId,
        discordTag: out.discordTag
      }, { 'Set-Cookie': buildSetCookie(req, out.cookieValue, out.maxAgeSec) });
    }

    if (method === 'GET' && pathname === '/api/auth/owner-claim') {
      const token = reqUrl.searchParams.get('token') || '';
      const out = DevAccess.claimOwnerOneTimeLink(token);
      if (!out.success) return sendJson(res, 401, out);
      res.writeHead(302, {
        Location: '/dev',
        'Set-Cookie': buildSetCookie(req, out.cookieValue, out.maxAgeSec),
        'Cache-Control': 'no-store'
      });
      return res.end();
    }

    if (method === 'GET' && pathname === '/api/auth/discord/url') {
      const mode = reqUrl.searchParams.get('mode') === 'owner' ? 'owner' : 'invite';
      const token = reqUrl.searchParams.get('token') || '';
      const url = DevAccess.buildDiscordOAuthAuthorizeUrl(token, mode, req);
      if (!url) return sendJson(res, 400, { error: 'Discord OAuth2 secret is not configured.' });
      return sendJson(res, 200, { url });
    }

    if (method === 'GET' && pathname === '/api/auth/discord/callback') {
      const code = reqUrl.searchParams.get('code');
      const state = reqUrl.searchParams.get('state');
      if (!code || !state) return sendJson(res, 400, { error: 'Missing OAuth code or state.' });
      try {
        const out = await DevAccess.completeDiscordOAuthCallback(code, state, client, req);
        if (!out.success) return sendJson(res, 403, out);
        res.writeHead(302, {
          Location: '/dev',
          'Set-Cookie': buildSetCookie(req, out.cookieValue, out.maxAgeSec),
          'Cache-Control': 'no-store'
        });
        return res.end();
      } catch (e) {
        return sendJson(res, 500, { error: 'Discord OAuth failed: ' + e.message });
      }
    }

    if (method === 'POST' && pathname === '/api/auth/logout') {
      const cookies = parseCookies(req);
      DevAccess.logoutSession(cookies[COOKIE_NAME]);
      return sendJson(res, 200, { success: true }, { 'Set-Cookie': buildClearCookie() });
    }
  }

  // ── 4. Protected Auth Middleware for /api/dev/* & /api/owner/* ───
  const cookies = parseCookies(req);
  const session = DevAccess.authenticateCookie(cookies[COOKIE_NAME]);
  if (!session) {
    return sendJson(res, 401, { error: 'Authentication required. Your session may have expired or been revoked by the Owner.' });
  }

  // ── 5. Developer + Owner Shared Maintenance Routes (/api/dev/*) ───
  if (method === 'GET' && pathname === '/api/dev/me') {
    const publicStatus = DevAccess.getPublicSafeStatus(req);
    return sendJson(res, 200, {
      authenticated: true,
      session: { role: session.role, discordId: session.discordId, discordTag: session.discordTag, expiresAt: session.expiresAt },
      permissions: session.role === 'owner'
        ? ['ALL_OWNER_CONTROLS', 'MANAGE_DEVELOPER', 'APPROVE_PR', 'RAILWAY_ROLLBACK', 'EDIT_CONFIG']
        : ['VIEW_EDIT_COMMANDS_AND_FEATURES', 'RUN_AI_DIAGNOSTICS', 'RUN_SANDBOX_TESTS', 'OPEN_MAINTENANCE_PR', 'VIEW_DEPLOY_AND_LOGS'],
      restrictions: session.role === 'developer'
        ? ['CANNOT_DELETE_REPO_FILES_OR_BRANCHES', 'CANNOT_COMMIT_DIRECTLY_TO_MAIN', 'CANNOT_DELETE_RAILWAY_OR_DB', 'CANNOT_EDIT_SECRETS_OR_OWNER_PERMS', 'CANNOT_REVOKE_OR_INVITE']
        : [],
      accessStatus: publicStatus,
      aiConfigured: Boolean(DevAi.getAiProviderConfig())
    });
  }

  if (method === 'GET' && pathname === '/api/dev/files') {
    const files = DevAi.listEditableFiles(2000);
    return sendJson(res, 200, { files });
  }

  if (method === 'GET' && pathname === '/api/dev/file') {
    const rel = DevPolicy.normalizeRelPath(reqUrl.searchParams.get('path') || '');
    if (!rel || !DevPolicy.isReadablePath(rel)) {
      return sendJson(res, 403, { error: 'Access Denied: Protected or invalid file path.' });
    }
    const full = path.join(DevPolicy.REPO_ROOT, rel);
    if (!fs.existsSync(full)) return sendJson(res, 404, { error: 'File not found' });
    return sendJson(res, 200, {
      path: rel,
      editable: DevPolicy.isEditablePath(rel),
      content: fs.readFileSync(full, 'utf8')
    });
  }

  if (method === 'POST' && pathname === '/api/dev/analyze') {
    const body = await readJsonBody(req);
    if (!body.prompt || !String(body.prompt).trim()) {
      return sendJson(res, 400, { error: 'Describe the bug or command fix in prompt.' });
    }
    const report = await DevAi.analyzeAndGenerateFix({
      prompt: String(body.prompt).trim(),
      targetPaths: Array.isArray(body.targetPaths) ? body.targetPaths : [],
      client
    });
    return sendJson(res, 200, report);
  }

  if (method === 'POST' && pathname === '/api/dev/create-command') {
    const body = await readJsonBody(req);
    const allowedCats = ['utility', 'fun', 'economy', 'social', 'games'];
    const cat = allowedCats.includes(String(body.category || '').toLowerCase()) ? String(body.category).toLowerCase() : 'utility';
    const rawName = String(body.name || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '').slice(0, 32);
    if (!rawName || rawName.length < 2) {
      return sendJson(res, 400, { error: 'Provide a valid command name (2-32 lowercase letters/numbers/hyphens).' });
    }
    const desc = String(body.description || 'Custom KIKI command').replace(/['`\\]/g, '').slice(0, 90);
    const replyText = String(body.responseText || `Executed ${rawName}!`).replace(/[`\\]/g, '').slice(0, 500);
    const relPath = `commands/${cat}/${rawName}.js`;
    const template =
`const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('${rawName}')
    .setDescription('${desc}'),

  name: '${rawName}',
  aliases: [],

  async execute(interaction) {
    const embed = KikiEmbed.purple('${rawName}', \`${replyText}\`);
    await interaction.reply({ embeds: [embed] });
  },

  async run(message) {
    const embed = KikiEmbed.purple('${rawName}', \`${replyText}\`);
    await message.reply({ embeds: [embed] });
  }
};
`;
    const scan = DevPolicy.scanCodeSafety(relPath, template);
    if (!scan.allowed) return sendJson(res, 403, { error: scan.reason });
    return sendJson(res, 200, { path: scan.normalizedPath, content: template });
  }

  if (method === 'POST' && pathname === '/api/dev/test') {
    const body = await readJsonBody(req, 2 * 1024 * 1024);
    const result = await DevTests.runVerificationSuite({
      actor: session,
      draftFiles: Array.isArray(body.files) ? body.files : []
    });
    return sendJson(res, 200, result);
  }

  if (method === 'POST' && pathname === '/api/dev/submit-pr') {
    const body = await readJsonBody(req, 2 * 1024 * 1024);
    const draftFiles = Array.isArray(body.files) ? body.files : [];
    if (draftFiles.length === 0) return sendJson(res, 400, { error: 'At least one edited file is required.' });

    // Run mandatory sandbox verification BEFORE pushing any maintenance commit/PR
    const testRes = await DevTests.runVerificationSuite({ actor: session, draftFiles });
    if (!testRes.passed) {
      return sendJson(res, 400, {
        error: 'Sandbox tests failed. Fix errors before creating a Pull Request.',
        testResults: testRes.results
      });
    }

    const prRes = await GitHubIntegration.commitAndOpenPullRequest({
      actor: session,
      files: draftFiles,
      title: body.title || 'Maintenance fix',
      description: body.description || '',
      errorFixed: body.errorFixed || body.description || body.title || ''
    });

    if (!prRes.success) return sendJson(res, 400, prRes);

    // Notify Sole Owner via Discord DM cleanly
    ActivityLogger.notifyOwnerDm(
      client,
      `🔧 New Maintenance PR #${prRes.prNumber} Ready for Review`,
      `**Submitted By:** \`${session.discordTag}\` (${session.role})\n` +
      `**Branch:** \`${prRes.branch}\` → \`main\`\n` +
      `**Files:** ${prRes.filesModified.map(f => `\`${f}\``).join(', ')}\n` +
      `**Error Fixed:** ${body.errorFixed || body.title}\n` +
      `**PR Link:** ${prRes.prUrl}\n\n` +
      `*Approve with \`&devaccess approve ${prRes.prNumber}\` or via the Owner Console.*`
    ).catch(() => {});

    // Urgent auto-deploy ONLY if Owner explicitly enabled it AND tests passed
    let autoDeployed = false;
    const state = DevAccess.loadState();
    if (state.settings?.urgentAutoDeploy && body.urgent === true) {
      const mergeOut = await GitHubIntegration.approveAndMergePullRequest(
        DevAccess.getSoleOwnerIds()[0],
        prRes.prNumber,
        true
      );
      if (mergeOut.success) {
        autoDeployed = true;
        await RailwayIntegration.triggerRedeploy({ role: 'system', discordTag: 'Urgent Auto-Deploy (Owner Authorized)' });
      }
    }

    return sendJson(res, 200, { ...prRes, testsPassed: true, testResults: testRes.results, autoDeployed });
  }

  if (method === 'GET' && pathname === '/api/dev/status') {
    const [ghStatus, rwStatus] = await Promise.all([
      GitHubIntegration.getStatus(),
      RailwayIntegration.getDeployments(6)
    ]);
    return sendJson(res, 200, {
      bot: RailwayIntegration.getBotLiveHealth(client),
      github: ghStatus,
      railway: rwStatus,
      access: DevAccess.getPublicSafeStatus(req)
    });
  }

  if (method === 'GET' && pathname === '/api/dev/logs') {
    return sendJson(res, 200, { logs: ActivityLogger.getRecent(60) });
  }

  // ── 6. Strict Sole Owner-Only Routes (/api/owner/*) ──────────────
  if (pathname.startsWith('/api/owner/')) {
    if (session.role !== 'owner' || !DevAccess.isSoleOwner(session.discordId)) {
      ActivityLogger.record({
        actorRole: session.role,
        actorId: session.discordId,
        actorTag: session.discordTag,
        action: 'POLICY_BLOCKED',
        summary: `Developer attempted Owner-only endpoint ${pathname}`
      });
      return sendJson(res, 403, { error: 'Forbidden: Only the Sole Bot Owner can perform this action.' });
    }

    if (method === 'POST' && pathname === '/api/owner/invite') {
      const body = await readJsonBody(req);
      try {
        const inv = DevAccess.createInvite(session.discordId, body.targetDiscordId, body.targetTag, body.ttlMinutes || 30, req);
        return sendJson(res, 200, { success: true, ...inv });
      } catch (e) {
        return sendJson(res, 400, { error: e.message });
      }
    }

    if (method === 'POST' && pathname === '/api/owner/revoke') {
      const body = await readJsonBody(req);
      const out = DevAccess.revokeDeveloper(session.discordId, body.reason || 'Revoked from Owner Console');
      return sendJson(res, 200, out);
    }

    if (method === 'POST' && pathname === '/api/owner/auto-deploy') {
      const body = await readJsonBody(req);
      const settings = DevAccess.setUrgentAutoDeploy(session.discordId, Boolean(body.enabled));
      return sendJson(res, 200, { success: true, settings });
    }

    if (method === 'POST' && pathname === '/api/owner/pr/approve') {
      const body = await readJsonBody(req);
      const out = await GitHubIntegration.approveAndMergePullRequest(session.discordId, body.prNumber, false);
      if (out.success && body.triggerDeploy !== false) {
        await RailwayIntegration.triggerRedeploy(session).catch(() => {});
      }
      return sendJson(res, out.success ? 200 : 400, out);
    }

    if (method === 'POST' && pathname === '/api/owner/github/protect') {
      const out = await GitHubIntegration.applyMainBranchProtection(session.discordId);
      return sendJson(res, out.success ? 200 : 400, out);
    }

    if (method === 'POST' && pathname === '/api/owner/railway/deploy') {
      const out = await RailwayIntegration.triggerRedeploy(session);
      return sendJson(res, out.success ? 200 : 400, out);
    }

    if (method === 'POST' && pathname === '/api/owner/railway/rollback') {
      const body = await readJsonBody(req);
      const out = await RailwayIntegration.rollbackDeployment(session.discordId, body.deploymentId);
      return sendJson(res, out.success ? 200 : 400, out);
    }

    if (method === 'POST' && pathname === '/api/owner/integrations') {
      const body = await readJsonBody(req);
      DevAccess.saveOwnerIntegrations(session.discordId, body);
      return sendJson(res, 200, { success: true });
    }
  }

  return sendJson(res, 404, { error: 'Endpoint not found' });
}

function attachMaintenanceServer(client) {
  const port = process.env.PORT || process.env.DEV_PORT;
  if (!port) return null;

  const server = http.createServer((req, res) => {
    handleRequest(req, res, client).catch(err => {
      RailwayIntegration.recordRuntimeError('http-server', err);
      sendJson(res, 500, { error: 'Internal server error' });
    });
  });

  server.listen(port, () => {
    console.log(chalk.green(`  🌐 [MAINTENANCE & HEALTH SERVER] Listening on port ${port} (/health & protected /dev)`));
  });
  return server;
}

module.exports = { attachMaintenanceServer, handleRequest };
