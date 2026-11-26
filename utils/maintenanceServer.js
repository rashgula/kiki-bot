// KIKI Bot - Authenticated Maintenance Website & API Server
// Zero Ownership UI or owner endpoints exposed on web — Owner controls live exclusively in Discord (&devaccess + DM buttons).
// Preserves health checks on / and /health while locking /dev and /api/dev/* behind verified friend sessions.

const fs = require('fs');
const path = require('path');
const http = require('http');
const { URL } = require('url');
const chalk = require('chalk');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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

function buildOwnerPrDmButtons(prNumber) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`devacc_approve_${prNumber}`).setLabel(`Approve & Deploy PR #${prNumber}`).setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`devacc_reject_${prNumber}`).setLabel('Reject PR').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('devacc_revoke').setLabel('Revoke Developer').setStyle(ButtonStyle.Danger)
    )
  ];
}

function extractCommandNames(files) {
  const cmds = [];
  for (const f of files || []) {
    const m = String(f.path || f).match(/^commands\/([^/]+)\/([^/]+)\.js$/i);
    if (m) cmds.push(`&${m[2]} (${m[1]})`);
  }
  return cmds;
}

async function notifyOwnerPrAndMaybeAutoDeploy(client, session, prRes, promptText, summaryText) {
  const cmdNames = extractCommandNames(prRes.filesModified);
  const state = DevAccess.loadState();
  let autoDeployed = false;
  let deployStatus = 'Awaiting Owner Approval (Click button below)';

  if (state.settings?.urgentAutoDeploy) {
    const mergeOut = await GitHubIntegration.approveAndMergePullRequest(
      DevAccess.getSoleOwnerIds()[0],
      prRes.prNumber,
      true
    );
    if (mergeOut.success) {
      const rwRes = await RailwayIntegration.triggerRedeploy({ role: 'system', discordTag: 'Urgent Auto-Deploy (Owner Authorized)' }).catch(() => ({ success: false }));
      autoDeployed = true;
      deployStatus = rwRes.success
        ? 'Merged to `main` & Railway Redeploy Triggered ✅'
        : 'Merged to `main` ✅ (GitHub/Railway auto-deploy follows)';
    }
  }

  const dmBody =
    `👨‍💻 **Kisne Kiya (Developer):** <@${session.discordId}> (\`${session.discordTag}\` • \`${session.discordId}\`)\n` +
    `💬 **Prompt / Command Request:** \`${String(promptText || summaryText || '').slice(0, 220)}\`\n` +
    `🛠️ **Command / Files Changed:** ${cmdNames.length ? cmdNames.map(c => `\`${c}\``).join(', ') : prRes.filesModified.map(f => `\`${f}\``).join(', ')}\n` +
    `📄 **Files Modified:** ${prRes.filesModified.map(f => `\`${f}\``).join(', ')}\n` +
    `🧪 **Sandbox Tests:** \`PASSED ✅\`\n` +
    `🐙 **GitHub PR:** [#${prRes.prNumber}](${prRes.prUrl}) (\`${prRes.branch}\` → \`main\`)\n` +
    `🚂 **Status:** ${deployStatus}`;

  const components = autoDeployed
    ? [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('devacc_revoke').setLabel('Revoke Developer').setStyle(ButtonStyle.Danger))]
    : buildOwnerPrDmButtons(prRes.prNumber);

  await ActivityLogger.notifyOwnerDm(
    client,
    autoDeployed ? `🚀 Maintenance Change Live (PR #${prRes.prNumber})` : `🔧 Maintenance PR #${prRes.prNumber} Approval Needed`,
    dmBody,
    components
  ).catch(() => {});

  return { autoDeployed, deployStatus, cmdNames };
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

  // ── 2. Private Maintenance Portal HTML (Developer UI Only) ───────
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

  // ── 3. Invite Claim Auth Endpoints Only (Zero Owner Web Auth) ────
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
        discordTag: out.discordTag
      }, { 'Set-Cookie': buildSetCookie(req, out.cookieValue, out.maxAgeSec) });
    }

    if (method === 'GET' && pathname === '/api/auth/discord/url') {
      const token = reqUrl.searchParams.get('token') || '';
      const url = DevAccess.buildDiscordOAuthAuthorizeUrl(token, 'invite', req);
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

    return sendJson(res, 404, { error: 'Auth endpoint not found' });
  }

  // ── 4. Protected Session Verification for /api/dev/* ──────────────
  const cookies = parseCookies(req);
  const session = DevAccess.authenticateCookie(cookies[COOKIE_NAME]);
  if (!session) {
    return sendJson(res, 401, { error: 'Authentication required. Your invite or session has expired or been revoked.' });
  }

  if (pathname.startsWith('/api/owner/')) {
    return sendJson(res, 403, { error: 'Ownership controls are exclusive to Discord (&devaccess).' });
  }

  // ── 5. Maintenance Studio Endpoints (/api/dev/*) ─────────────────
  if (method === 'GET' && pathname === '/api/dev/me') {
    return sendJson(res, 200, {
      authenticated: true,
      session: { discordId: session.discordId, discordTag: session.discordTag, expiresAt: session.expiresAt },
      aiConfigured: Boolean(DevAi.getAiProviderConfig()),
      githubConfigured: GitHubIntegration.getConfigSummary().connected
    });
  }

  if (method === 'GET' && pathname === '/api/dev/files') {
    return sendJson(res, 200, { files: DevAi.listEditableFiles(2000) });
  }

  if (method === 'GET' && pathname === '/api/dev/file') {
    const rel = DevPolicy.normalizeRelPath(reqUrl.searchParams.get('path') || '');
    if (!rel || !DevPolicy.isReadablePath(rel)) {
      return sendJson(res, 403, { error: 'Access Denied: Protected or invalid file path.' });
    }
    const full = path.join(DevPolicy.REPO_ROOT, rel);
    if (!fs.existsSync(full)) return sendJson(res, 404, { error: 'File not found' });
    return sendJson(res, 200, { path: rel, editable: DevPolicy.isEditablePath(rel), content: fs.readFileSync(full, 'utf8') });
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

  // Unified 1-Click Pipeline: Prompt/Draft -> AI Fix -> Sandbox Test -> GitHub PR -> Owner DM Notification (+ Deploy if autoDeploy enabled)
  if (method === 'POST' && pathname === '/api/dev/one-click-run') {
    const body = await readJsonBody(req, 2 * 1024 * 1024);
    const prompt = String(body.prompt || '').trim();
    let draftFiles = Array.isArray(body.files) ? body.files : [];
    let diagnosis = null;

    if (draftFiles.length === 0) {
      if (!prompt) return sendJson(res, 400, { error: 'CMD / problem box me kuch likhein ya file edit save karein.' });
      diagnosis = await DevAi.analyzeAndGenerateFix({
        prompt,
        targetPaths: Array.isArray(body.targetPaths) ? body.targetPaths : [],
        client
      });
      if (diagnosis.proposedEdits && diagnosis.proposedEdits.length > 0) {
        draftFiles = diagnosis.proposedEdits.map(e => ({ path: e.path, content: e.content, summary: e.summary }));
      } else {
        return sendJson(res, 200, {
          stage: 'needs_edit',
          aiPowered: diagnosis.aiPowered,
          rootCause: diagnosis.rootCause,
          matchedFiles: diagnosis.matchedFiles || [],
          recentErrors: diagnosis.recentErrors || [],
          message: diagnosis.aiPowered
            ? 'AI ne koi automatic file edit propose nahi kiya. Niche editor se file kholkar edit karein aur dubara Run dabayein.'
            : 'GEMINI_API_KEY set nahi hai, isliye auto-code generation off hai — niche matched file kholkar edit karein ya New Command Draft banayein aur dubara Run dabayein.'
        });
      }
    }

    const testRes = await DevTests.runVerificationSuite({ actor: session, draftFiles });
    if (!testRes.passed) {
      return sendJson(res, 400, {
        stage: 'test_failed',
        error: 'Sandbox tests failed. Fix error before submitting.',
        diagnosis,
        testResults: testRes.results,
        proposedEdits: draftFiles
      });
    }

    const prRes = await GitHubIntegration.commitAndOpenPullRequest({
      actor: session,
      files: draftFiles,
      title: body.title || diagnosis?.errorFixed || prompt.slice(0, 60) || 'Maintenance update',
      description: prompt,
      errorFixed: diagnosis?.errorFixed || prompt || 'Code update'
    });

    if (!prRes.success) {
      return sendJson(res, 400, {
        stage: 'github_failed',
        error: prRes.error,
        diagnosis,
        testResults: testRes.results,
        proposedEdits: draftFiles
      });
    }

    const notifyOut = await notifyOwnerPrAndMaybeAutoDeploy(client, session, prRes, prompt, diagnosis?.errorFixed);
    return sendJson(res, 200, {
      stage: 'completed',
      success: true,
      diagnosis,
      testResults: testRes.results,
      ...prRes,
      ...notifyOut
    });
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

    const testRes = await DevTests.runVerificationSuite({ actor: session, draftFiles });
    if (!testRes.passed) {
      return sendJson(res, 400, { error: 'Sandbox tests failed. Fix errors before submitting PR.', testResults: testRes.results });
    }

    const prRes = await GitHubIntegration.commitAndOpenPullRequest({
      actor: session,
      files: draftFiles,
      title: body.title || 'Maintenance fix',
      description: body.description || '',
      errorFixed: body.errorFixed || body.description || body.title || ''
    });
    if (!prRes.success) return sendJson(res, 400, prRes);

    const notifyOut = await notifyOwnerPrAndMaybeAutoDeploy(client, session, prRes, body.description, body.errorFixed || body.title);
    return sendJson(res, 200, { ...prRes, testsPassed: true, testResults: testRes.results, ...notifyOut });
  }

  if (method === 'GET' && pathname === '/api/dev/status') {
    const [ghStatus, rwStatus] = await Promise.all([
      GitHubIntegration.getStatus(),
      RailwayIntegration.getDeployments(5)
    ]);
    return sendJson(res, 200, {
      bot: RailwayIntegration.getBotLiveHealth(client),
      github: { connected: ghStatus.connected, repo: ghStatus.repo, mainBranch: ghStatus.mainBranch, maintenanceBranch: ghStatus.maintenanceBranch, openPullRequests: ghStatus.openPullRequests },
      railway: { configured: rwStatus.configured, service: rwStatus.serviceName, deployments: rwStatus.deployments }
    });
  }

  if (method === 'GET' && pathname === '/api/dev/logs') {
    return sendJson(res, 200, { logs: ActivityLogger.getRecent(50) });
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
    console.log(chalk.green(`  🌐 [MAINTENANCE & HEALTH SERVER] Listening on port ${port} (/health & /dev)`));
  });
  return server;
}

module.exports = { attachMaintenanceServer, handleRequest };
