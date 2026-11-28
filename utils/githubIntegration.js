// KIKI Bot - GitHub App / Scoped REST PR Integration (Least-Privilege & Main-Protected)
// Commits fixes ONLY onto dedicated bot-maintenance branch & submits PRs to main.
// NEVER exposes delete-repo, delete-branch, transfer-ownership, or force-push-main operations.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const DevAccess = require('./devAccess.js');
const DevPolicy = require('./devPolicy.js');
const ActivityLogger = require('./activityLogger.js');

const API_BASE = 'https://api.github.com';

function detectRepoSlug() {
  const configured = DevAccess.getPlainFromEnvOrVault('GITHUB_REPO', 'githubRepo');
  if (configured && configured.includes('/')) return configured.trim();
  try {
    const gitCfg = path.join(DevPolicy.REPO_ROOT, '.git', 'config');
    if (fs.existsSync(gitCfg)) {
      const txt = fs.readFileSync(gitCfg, 'utf8');
      const m = txt.match(/github\.com[:/]([^/\s]+\/[^.\s\r\n]+)(?:\.git)?/i);
      if (m) return m[1];
    }
  } catch {}
  return 'rashgula/kiki-bot';
}

function createGitHubAppJwt(appId, privateKeyPem) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ iat: now - 60, exp: now + 540, iss: String(appId) })).toString('base64url');
  const signingInput = `${header}.${payload}`;
  const cleanPem = String(privateKeyPem).replace(/\\n/g, '\n');
  const sig = crypto.sign('RSA-SHA256', Buffer.from(signingInput), cleanPem).toString('base64url');
  return `${signingInput}.${sig}`;
}

async function getAuthHeaders() {
  // 1. Prefer Least-Privilege GitHub App Installation Token
  const appId = DevAccess.getPlainFromEnvOrVault('GITHUB_APP_ID', 'githubAppId');
  const installId = DevAccess.getPlainFromEnvOrVault('GITHUB_APP_INSTALLATION_ID', 'githubInstallationId');
  const privKey = DevAccess.getSecretFromEnvOrVault('GITHUB_PRIVATE_KEY', 'githubPrivateKeyEnc');

  if (appId && installId && privKey) {
    const jwt = createGitHubAppJwt(appId, privKey);
    const res = await axios.post(
      `${API_BASE}/app/installations/${installId}/access_tokens`,
      {
        permissions: {
          contents: 'write',
          pull_requests: 'write',
          checks: 'read',
          metadata: 'read'
        }
      },
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'KIKI-Maintenance-Portal'
        },
        timeout: 12000
      }
    );
    return {
      mode: 'github-app',
      headers: {
        Authorization: `token ${res.data.token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'KIKI-Maintenance-Portal'
      }
    };
  }

  // 2. Fallback to scoped GITHUB_TOKEN / GITHUB_PAT
  const pat = DevAccess.getSecretFromEnvOrVault('GITHUB_TOKEN', 'githubTokenEnc');
  if (pat) {
    return {
      mode: 'scoped-token',
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'KIKI-Maintenance-Portal'
      }
    };
  }

  return null;
}

const GitHubIntegration = {
  getConfigSummary() {
    const repo = detectRepoSlug();
    const state = DevAccess.loadState();
    const hasApp = Boolean(
      DevAccess.getPlainFromEnvOrVault('GITHUB_APP_ID', 'githubAppId') &&
      DevAccess.getPlainFromEnvOrVault('GITHUB_APP_INSTALLATION_ID', 'githubInstallationId') &&
      DevAccess.getSecretFromEnvOrVault('GITHUB_PRIVATE_KEY', 'githubPrivateKeyEnc')
    );
    const hasPat = Boolean(DevAccess.getSecretFromEnvOrVault('GITHUB_TOKEN', 'githubTokenEnc'));
    return {
      connected: hasApp || hasPat,
      authMode: hasApp ? 'github-app' : (hasPat ? 'scoped-token' : 'not-configured'),
      repo,
      mainBranch: state.settings?.mainBranch || 'main',
      maintenanceBranch: state.settings?.maintenanceBranch || 'bot-maintenance'
    };
  },

  async getStatus() {
    const summary = this.getConfigSummary();
    if (!summary.connected) {
      return {
        ...summary,
        openPullRequests: [],
        mainProtected: 'unknown (configure GITHUB_APP_* or GITHUB_TOKEN)'
      };
    }

    try {
      const auth = await getAuthHeaders();
      const [prsRes, protRes] = await Promise.all([
        axios.get(`${API_BASE}/repos/${summary.repo}/pulls?state=open&base=${summary.mainBranch}`, { headers: auth.headers, timeout: 10000 }),
        axios.get(`${API_BASE}/repos/${summary.repo}/branches/${summary.mainBranch}/protection`, { headers: auth.headers, timeout: 10000 }).catch(e => ({ status: e.response?.status, data: null }))
      ]);

      return {
        ...summary,
        mainProtected: protRes?.status !== 404 && Boolean(protRes?.data),
        branchProtectionDetails: protRes?.data ? {
          enforceAdmins: Boolean(protRes.data.enforce_admins?.enabled),
          requireReviews: Boolean(protRes.data.required_pull_request_reviews),
          allowForcePushes: Boolean(protRes.data.allow_force_pushes?.enabled),
          allowDeletions: Boolean(protRes.data.allow_deletions?.enabled)
        } : null,
        openPullRequests: (prsRes.data || []).map(pr => ({
          number: pr.number,
          title: pr.title,
          head: pr.head?.ref,
          base: pr.base?.ref,
          url: pr.html_url,
          author: pr.user?.login,
          createdAt: pr.created_at
        }))
      };
    } catch (err) {
      return {
        ...summary,
        error: err.response?.data?.message || err.message,
        openPullRequests: []
      };
    }
  },

  // Commit approved policy-checked file changes ONLY to a maintenance branch and submit a PR to main
  async commitAndOpenPullRequest({ actor, files, title, description, errorFixed }) {
    const auth = await getAuthHeaders();
    if (!auth) {
      return {
        success: false,
        error: 'GitHub App / Token is not configured yet. Set GITHUB_APP_ID + GITHUB_PRIVATE_KEY + GITHUB_APP_INSTALLATION_ID (or GITHUB_TOKEN) in Railway/Owner settings.'
      };
    }

    if (!Array.isArray(files) || files.length === 0) {
      return { success: false, error: 'No modified files provided.' };
    }

    // Strict server-side path & security scan on EVERY file before touching GitHub
    const safeFiles = [];
    for (const f of files) {
      const scan = DevPolicy.scanCodeSafety(f.path, f.content);
      if (!scan.allowed) {
        ActivityLogger.record({
          actorRole: actor.role,
          actorId: actor.discordId,
          actorTag: actor.discordTag,
          action: 'POLICY_BLOCKED',
          summary: `Blocked unsafe commit attempt to ${f.path}: ${scan.reason}`,
          filesModified: [f.path]
        });
        return { success: false, error: scan.reason };
      }
      safeFiles.push({ path: scan.normalizedPath, content: f.content });
    }

    const summary = this.getConfigSummary();
    const repo = summary.repo;
    const mainBranch = summary.mainBranch;
    const maintBaseBranch = summary.maintenanceBranch || 'bot-maintenance';
    const rawSlug = String(title || 'fix').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32);
    const slug = rawSlug.replace(/-+$/, '') || 'fix';
    // Use flat branch prefix (maint-...) without subdirectories to prevent Git D/F conflict with existing bot-maintenance branch!
    let fixBranch = `maint-${slug}-${Date.now().toString(36)}`;

    // Never allow target branch to be main
    if (fixBranch === mainBranch || fixBranch === 'master') {
      return { success: false, error: 'Direct commits to protected main branch are forbidden.' };
    }

    try {
      // 1. Get latest main SHA & base tree
      const mainRefRes = await axios.get(`${API_BASE}/repos/${repo}/git/ref/heads/${mainBranch}`, { headers: auth.headers, timeout: 10000 });
      const mainSha = mainRefRes.data.object.sha;

      const baseCommitRes = await axios.get(`${API_BASE}/repos/${repo}/git/commits/${mainSha}`, { headers: auth.headers, timeout: 10000 });
      const baseTreeSha = baseCommitRes.data.tree.sha;

      // 2. Create blobs & tree
      const treeItems = [];
      for (const f of safeFiles) {
        const blobRes = await axios.post(
          `${API_BASE}/repos/${repo}/git/blobs`,
          { content: Buffer.from(f.content, 'utf8').toString('base64'), encoding: 'base64' },
          { headers: auth.headers, timeout: 10000 }
        );
        treeItems.push({ path: f.path, mode: '100644', type: 'blob', sha: blobRes.data.sha });
      }

      const newTreeRes = await axios.post(
        `${API_BASE}/repos/${repo}/git/trees`,
        { base_tree: baseTreeSha, tree: treeItems },
        { headers: auth.headers, timeout: 10000 }
      );

      // 3. Create commit pointing directly to mainSha as parent
      const commitMsg = `[bot-maintenance] ${title || 'Maintenance fix'}\n\nRequested by: ${actor.discordTag} (${actor.discordId})\nError Fixed: ${errorFixed || description || 'Bug fix'}`;
      const newCommitRes = await axios.post(
        `${API_BASE}/repos/${repo}/git/commits`,
        { message: commitMsg, tree: newTreeRes.data.sha, parents: [mainSha] },
        { headers: auth.headers, timeout: 10000 }
      );
      const newCommitSha = newCommitRes.data.sha;

      // 4. Create branch pointing directly to newCommitSha with resilient retry to avoid transient GitHub replication lag
      let branchCreated = false;
      let lastRefErr = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const branchName = attempt === 0
            ? fixBranch
            : `maint-${slug}-${Date.now().toString(36)}-${crypto.randomBytes(2).toString('hex')}`;
          await axios.post(
            `${API_BASE}/repos/${repo}/git/refs`,
            { ref: `refs/heads/${branchName}`, sha: newCommitSha },
            { headers: auth.headers, timeout: 10000 }
          );
          fixBranch = branchName;
          branchCreated = true;
          break;
        } catch (rErr) {
          lastRefErr = rErr;
          await new Promise(r => setTimeout(r, 400 * (attempt + 1)));
        }
      }
      if (!branchCreated && lastRefErr) {
        throw lastRefErr;
      }

      // 5. Keep dedicated bot-maintenance branch synced with latest maintenance commits
      try {
        const maintRef = await axios.get(`${API_BASE}/repos/${repo}/git/ref/heads/${maintBaseBranch}`, { headers: auth.headers, timeout: 6000 }).catch(() => null);
        if (!maintRef) {
          await axios.post(`${API_BASE}/repos/${repo}/git/refs`, { ref: `refs/heads/${maintBaseBranch}`, sha: newCommitSha }, { headers: auth.headers, timeout: 6000 });
        } else {
          await axios.patch(`${API_BASE}/repos/${repo}/git/refs/heads/${maintBaseBranch}`, { sha: newCommitSha, force: true }, { headers: auth.headers, timeout: 6000 });
        }
      } catch {}

      // 6. Open Pull Request into protected main branch
      const prBody =
        `### 🔧 KIKI Maintenance Fix Pull Request\n\n` +
        `- **Author (Trusted Developer):** \`${actor.discordTag}\` (\`${actor.discordId}\`)\n` +
        `- **Target:** \`${mainBranch}\` <- \`${fixBranch}\`\n` +
        `- **Issue / Error Fixed:** ${errorFixed || description || 'N/A'}\n` +
        `- **Modified Files:**\n${safeFiles.map(f => `  - \`${f.path}\``).join('\n')}\n\n` +
        `> ⚠️ Requires **Sole Owner** approval before merging into protected \`${mainBranch}\`.`;

      const prRes = await axios.post(
        `${API_BASE}/repos/${repo}/pulls`,
        {
          title: `[Maintenance] ${title || 'Bot Fix'}`,
          head: fixBranch,
          base: mainBranch,
          body: prBody
        },
        { headers: auth.headers, timeout: 12000 }
      );

      const result = {
        success: true,
        branch: fixBranch,
        commitSha: newCommitRes.data.sha,
        prNumber: prRes.data.number,
        prUrl: prRes.data.html_url,
        filesModified: safeFiles.map(f => f.path)
      };

      ActivityLogger.record({
        actorRole: actor.role,
        actorId: actor.discordId,
        actorTag: actor.discordTag,
        action: 'GITHUB_PR_CREATED',
        summary: `Opened PR #${result.prNumber} on branch ${fixBranch}`,
        errorFixed: errorFixed || description || title,
        filesModified: result.filesModified,
        github: { branch: fixBranch, commitSha: result.commitSha, prNumber: result.prNumber, prUrl: result.prUrl }
      });

      return result;
    } catch (err) {
      const mainErr = err.response?.data?.message || err.message;
      const subErrors = Array.isArray(err.response?.data?.errors)
        ? ': ' + err.response.data.errors.map(e => e.message || JSON.stringify(e)).join('; ')
        : '';
      return {
        success: false,
        error: `${mainErr}${subErrors}`
      };
    }
  },

  // Owner-only (or explicitly Owner-enabled urgentAutoDeploy) PR approval & merge into main
  async approveAndMergePullRequest(ownerUserId, prNumber, urgentAuto = false) {
    if (!urgentAuto && !DevAccess.isSoleOwner(ownerUserId)) {
      return { success: false, error: 'Only Sole Owner can approve and merge PRs into main.' };
    }
    const state = DevAccess.loadState();
    if (urgentAuto && !state.settings?.urgentAutoDeploy) {
      return { success: false, error: 'Urgent Auto-Deploy is disabled by the Sole Owner.' };
    }

    const auth = await getAuthHeaders();
    if (!auth) return { success: false, error: 'GitHub credentials not configured.' };
    const summary = this.getConfigSummary();

    try {
      const mergeRes = await axios.put(
        `${API_BASE}/repos/${summary.repo}/pulls/${prNumber}/merge`,
        {
          merge_method: 'squash',
          commit_title: `[Owner Approved #${prNumber}] Maintenance fix`
        },
        { headers: auth.headers, timeout: 12000 }
      );

      ActivityLogger.record({
        actorRole: urgentAuto ? 'system' : 'owner',
        actorId: String(ownerUserId || 'auto-deploy'),
        actorTag: urgentAuto ? 'Urgent Auto-Deploy (Owner Enabled)' : 'Sole Owner',
        action: 'OWNER_PR_APPROVED',
        summary: `Merged PR #${prNumber} into ${summary.mainBranch}`,
        github: { prNumber: Number(prNumber), commitSha: mergeRes.data.sha }
      });

      return { success: true, merged: true, sha: mergeRes.data.sha, message: mergeRes.data.message };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || err.message };
    }
  },

  async closePullRequest(ownerUserId, prNumber) {
    if (!DevAccess.isSoleOwner(ownerUserId)) {
      return { success: false, error: 'Only Sole Owner can reject/close PRs.' };
    }
    const auth = await getAuthHeaders();
    if (!auth) return { success: false, error: 'GitHub credentials not configured.' };
    const summary = this.getConfigSummary();
    try {
      await axios.patch(
        `${API_BASE}/repos/${summary.repo}/pulls/${prNumber}`,
        { state: 'closed' },
        { headers: auth.headers, timeout: 10000 }
      );
      ActivityLogger.record({
        actorRole: 'owner',
        actorId: String(ownerUserId),
        actorTag: 'Sole Owner',
        action: 'OWNER_PR_REJECTED',
        summary: `Closed PR #${prNumber} without merging into ${summary.mainBranch}.`,
        github: { prNumber: Number(prNumber) }
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || err.message };
    }
  },

  // Configure GitHub branch protection rules on main (requires admin permissions on repo token once)
  async applyMainBranchProtection(ownerUserId) {
    if (!DevAccess.isSoleOwner(ownerUserId)) {
      return { success: false, error: 'Only Sole Owner can update branch protection.' };
    }
    const auth = await getAuthHeaders();
    if (!auth) return { success: false, error: 'GitHub credentials not configured.' };
    const summary = this.getConfigSummary();

    try {
      await axios.put(
        `${API_BASE}/repos/${summary.repo}/branches/${summary.mainBranch}/protection`,
        {
          required_status_checks: { strict: true, contexts: ['verify-kiki-bot'] },
          enforce_admins: true,
          required_pull_request_reviews: {
            dismiss_stale_reviews: true,
            require_code_owner_reviews: false,
            required_approving_review_count: 1
          },
          restrictions: null,
          allow_force_pushes: false,
          allow_deletions: false
        },
        { headers: auth.headers, timeout: 12000 }
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || err.message };
    }
  }
};

module.exports = GitHubIntegration;
