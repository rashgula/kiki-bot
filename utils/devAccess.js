// KIKI Bot - Trusted Developer Authentication, Invite & Session Manager
// Enforces Single Sole Owner, Single Authorized Friend, Single-Use Time-Limited Invites, and Instant Revocation.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const config = require('../config.js');
const CloudSync = require('./cloudSync.js');
const DevSecrets = require('./devSecrets.js');
const ActivityLogger = require('./activityLogger.js');

const LEGACY_ACCESS_FILE = path.join(__dirname, '..', 'data', 'dev_access.json');
const DEFAULT_SOLE_OWNER_ID = '989411027798089778';

function getAccessFile() {
  return CloudSync.getDataFile('dev_access.json');
}

function defaultState() {
  return {
    version: 1,
    developer: null,        // { discordId, discordTag, status: 'active'|'revoked', boundAt, revokedAt, invitedBy }
    pendingInvite: null,    // { id, tokenHash, targetDiscordId, targetTag, createdBy, createdAt, expiresAt, used, usedAt, otpHash, otpExpiresAt, otpAttempts }
    ownerChallenge: null,   // { targetDiscordId, otpHash, expiresAt, attempts }
    ownerOneTimeLink: null, // { tokenHash, targetDiscordId, expiresAt, used }
    sessions: [],           // [{ idHash, role, discordId, discordTag, createdAt, expiresAt }]
    settings: {
      urgentAutoDeploy: false,
      maintenanceBranch: process.env.GITHUB_MAINTENANCE_BRANCH || 'bot-maintenance',
      mainBranch: process.env.GITHUB_MAIN_BRANCH || 'main'
    },
    vault: {}               // AES-256-GCM encrypted optional Owner-supplied credentials
  };
}

function loadState() {
  const data = CloudSync.readJsonSafe(getAccessFile(), null);
  if (data && typeof data === 'object' && data.version) return { ...defaultState(), ...data };
  if (!process.env.DATA_DIR && fs.existsSync(LEGACY_ACCESS_FILE)) {
    const legacy = CloudSync.readJsonSafe(LEGACY_ACCESS_FILE, null);
    if (legacy && typeof legacy === 'object' && legacy.version) return { ...defaultState(), ...legacy };
  }
  return defaultState();
}

function saveState(state) {
  // Prune expired sessions before saving
  const now = Date.now();
  state.sessions = (state.sessions || []).filter(s => s && s.expiresAt > now).slice(-20);
  CloudSync.writeJsonAtomic(getAccessFile(), state);
}

function getSoleOwnerIds() {
  const envList = (config.OWNER_IDS || [DEFAULT_SOLE_OWNER_ID]).map(String).filter(Boolean);
  return envList.length > 0 ? envList : [DEFAULT_SOLE_OWNER_ID];
}

function isSoleOwner(userId) {
  if (!userId) return false;
  return getSoleOwnerIds().includes(String(userId).trim());
}

function getDashboardBaseUrl(req = null) {
  const state = loadState();
  const vaultUrl = state.vault?.dashboardBaseUrl;
  if (vaultUrl && /^https?:\/\//i.test(vaultUrl)) return vaultUrl.replace(/\/+$/, '');
  if (process.env.DASHBOARD_BASE_URL && /^https?:\/\//i.test(process.env.DASHBOARD_BASE_URL)) {
    return process.env.DASHBOARD_BASE_URL.replace(/\/+$/, '');
  }
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN.replace(/\/+$/, '')}`;
  }
  if (process.env.RAILWAY_STATIC_URL) {
    const raw = process.env.RAILWAY_STATIC_URL;
    return raw.startsWith('http') ? raw.replace(/\/+$/, '') : `https://${raw.replace(/\/+$/, '')}`;
  }
  if (req && req.headers?.host) {
    const proto = String(req.headers['x-forwarded-proto'] || 'http').split(',')[0].trim();
    return `${proto}://${req.headers.host}`;
  }
  const port = process.env.PORT || process.env.DEV_PORT || 3000;
  return `http://localhost:${port}`;
}

function getSecretFromEnvOrVault(envName, vaultEncKey) {
  if (process.env[envName]) return process.env[envName];
  const state = loadState();
  const enc = state.vault?.[vaultEncKey];
  return enc ? DevSecrets.decryptSecret(enc) : null;
}

function getPlainFromEnvOrVault(envName, vaultKey, fallback = null) {
  if (process.env[envName]) return process.env[envName];
  const state = loadState();
  return state.vault?.[vaultKey] || fallback;
}

const DevAccess = {
  getSoleOwnerIds,
  isSoleOwner,
  loadState,
  getDashboardBaseUrl,
  getSecretFromEnvOrVault,
  getPlainFromEnvOrVault,

  isTrustedDeveloper(userId) {
    if (!userId) return false;
    const state = loadState();
    return Boolean(
      state.developer &&
      state.developer.status === 'active' &&
      String(state.developer.discordId) === String(userId)
    );
  },

  // Strictly Owner-only: Create single-use, time-limited invite bound to ONE Discord User ID
  createInvite(ownerUserId, targetDiscordId, targetTag = null, ttlMinutes = 30, req = null) {
    if (!isSoleOwner(ownerUserId)) {
      throw new Error('Unauthorized: Only the Sole Bot Owner can create developer invitations.');
    }
    const cleanTarget = String(targetDiscordId || '').replace(/[<@!>]/g, '').trim();
    if (!/^\d{17,20}$/.test(cleanTarget)) {
      throw new Error('Invalid Friend Discord User ID. Provide a valid 17-20 digit Discord ID or @mention.');
    }
    if (isSoleOwner(cleanTarget)) {
      throw new Error('Cannot invite the Owner as a Developer.');
    }

    const ttlMs = Math.min(Math.max(5, Number(ttlMinutes) || 30), 24 * 60) * 60 * 1000;
    const rawToken = DevSecrets.generateToken(32);
    const now = Date.now();
    const state = loadState();

    // Only one active pending invite & one developer slot allowed; reset old pending invite
    state.pendingInvite = {
      id: `inv_${now}_${crypto.randomBytes(3).toString('hex')}`,
      tokenHash: DevSecrets.hashToken(rawToken),
      targetDiscordId: cleanTarget,
      targetTag: targetTag || cleanTarget,
      createdBy: String(ownerUserId),
      createdAt: now,
      expiresAt: now + ttlMs,
      used: false,
      usedAt: null,
      otpHash: null,
      otpExpiresAt: null,
      otpAttempts: 0
    };
    saveState(state);

    ActivityLogger.record({
      actorRole: 'owner',
      actorId: String(ownerUserId),
      actorTag: 'Sole Owner',
      action: 'INVITE_CREATED',
      summary: `Created single-use developer invite bound to Discord ID ${cleanTarget} (expires in ${Math.round(ttlMs / 60000)}m)`
    });

    const baseUrl = getDashboardBaseUrl(req);
    return {
      inviteId: state.pendingInvite.id,
      inviteUrl: `${baseUrl}/dev?invite=${encodeURIComponent(rawToken)}`,
      rawToken,
      targetDiscordId: cleanTarget,
      expiresAt: state.pendingInvite.expiresAt
    };
  },

  validatePendingInvite(rawToken) {
    if (!rawToken || typeof rawToken !== 'string') return { valid: false, reason: 'Missing invite token.' };
    const state = loadState();
    const inv = state.pendingInvite;
    if (!inv) return { valid: false, reason: 'No active developer invitation exists.' };
    if (inv.used) return { valid: false, reason: 'This invitation link has already been used (single-use).' };
    if (Date.now() > inv.expiresAt) return { valid: false, reason: 'This invitation link has expired.' };
    const providedHash = DevSecrets.hashToken(rawToken);
    if (!DevSecrets.safeEqual(providedHash, inv.tokenHash)) {
      return { valid: false, reason: 'Invalid invitation token.' };
    }
    return { valid: true, invite: inv };
  },

  // Send 6-digit verification code via live Discord Bot DM to the SPECIFIC bound friend Discord ID
  async sendInviteDmOtp(client, rawToken, submittedDiscordId) {
    const check = this.validatePendingInvite(rawToken);
    if (!check.valid) return { success: false, error: check.reason };

    const cleanSubmitted = String(submittedDiscordId || '').replace(/[<@!>]/g, '').trim();
    if (!DevSecrets.safeEqual(cleanSubmitted, check.invite.targetDiscordId)) {
      ActivityLogger.record({
        actorRole: 'anonymous',
        action: 'AUTH_FAILED',
        summary: `Rejected invite claim attempt with mismatched Discord ID ${cleanSubmitted || 'empty'}`
      });
      return { success: false, error: 'Discord ID does not match the authorized developer for this invite.' };
    }

    if (!client || !client.isReady?.()) {
      return { success: false, error: 'Discord Bot client is not connected yet to deliver DM verification code.' };
    }

    const otp = DevSecrets.generateOtp();
    const state = loadState();
    state.pendingInvite.otpHash = DevSecrets.hashToken(otp);
    state.pendingInvite.otpExpiresAt = Date.now() + 5 * 60 * 1000;
    state.pendingInvite.otpAttempts = 0;
    saveState(state);

    try {
      const targetUser = await client.users.fetch(check.invite.targetDiscordId);
      await targetUser.send(
        `🔐 **KIKI Trusted Developer 2FA Verification Code:** \`${otp}\`\n` +
        `• Valid for **5 minutes** (single-use)\n` +
        `• Bound Account: \`${targetUser.tag}\` (\`${targetUser.id}\`)\n` +
        `• *If you did not request maintenance access, ignore this message.*`
      );

      return {
        success: true,
        maskedTag: `${targetUser.username} (DM Sent)`,
        expiresInSec: 300
      };
    } catch (err) {
      return {
        success: false,
        error: `Could not send DM to Discord user ${check.invite.targetDiscordId}. Make sure your Discord DMs are open to KIKI bot! (${err.message})`
      };
    }
  },

  async verifyInviteDmOtp(client, rawToken, submittedDiscordId, otpCode) {
    const check = this.validatePendingInvite(rawToken);
    if (!check.valid) return { success: false, error: check.reason };

    const state = loadState();
    const inv = state.pendingInvite;
    const cleanSubmitted = String(submittedDiscordId || '').replace(/[<@!>]/g, '').trim();

    if (!DevSecrets.safeEqual(cleanSubmitted, inv.targetDiscordId)) {
      return { success: false, error: 'Discord ID mismatch.' };
    }
    if (!inv.otpHash || !inv.otpExpiresAt || Date.now() > inv.otpExpiresAt) {
      return { success: false, error: 'Verification code expired or not requested. Request a new code.' };
    }
    if ((inv.otpAttempts || 0) >= 5) {
      inv.used = true;
      saveState(state);
      return { success: false, error: 'Too many invalid OTP attempts. Invite invalidated for security.' };
    }

    if (!DevSecrets.safeEqual(DevSecrets.hashToken(String(otpCode || '').trim()), inv.otpHash)) {
      inv.otpAttempts = (inv.otpAttempts || 0) + 1;
      saveState(state);
      return { success: false, error: `Incorrect verification code (${5 - inv.otpAttempts} attempts left).` };
    }

    let userTag = inv.targetTag || cleanSubmitted;
    try {
      if (client?.isReady?.()) {
        const u = await client.users.fetch(cleanSubmitted);
        if (u) userTag = u.tag || u.username;
      }
    } catch {}

    return this._completeDeveloperBinding(state, cleanSubmitted, userTag, 'DISCORD_BOT_DM_2FA', client);
  },

  // Optional full Discord OAuth2 flow (when DISCORD_CLIENT_SECRET is configured)
  hasOAuthConfigured() {
    return Boolean(process.env.CLIENT_ID && getSecretFromEnvOrVault('DISCORD_CLIENT_SECRET', 'discordClientSecretEnc'));
  },

  buildDiscordOAuthAuthorizeUrl(rawToken, mode = 'invite', req = null) {
    const clientId = process.env.CLIENT_ID;
    const secret = getSecretFromEnvOrVault('DISCORD_CLIENT_SECRET', 'discordClientSecretEnc');
    if (!clientId || !secret) return null;

    const redirectUri = `${getDashboardBaseUrl(req)}/api/auth/discord/callback`;
    const statePayload = DevSecrets.signPayload(Buffer.from(JSON.stringify({ mode, token: rawToken || '', ts: Date.now() })).toString('base64url'));
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify',
      state: statePayload
    });
    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  },

  async completeDiscordOAuthCallback(code, signedState, client = null, req = null) {
    const payloadB64 = DevSecrets.verifySignedPayload(signedState);
    if (!payloadB64) return { success: false, error: 'Invalid or tampered OAuth state.' };
    let parsed;
    try {
      parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    } catch {
      return { success: false, error: 'Corrupt OAuth state.' };
    }
    if (Date.now() - (parsed.ts || 0) > 10 * 60 * 1000) {
      return { success: false, error: 'OAuth login timed out.' };
    }

    const clientId = process.env.CLIENT_ID;
    const clientSecret = getSecretFromEnvOrVault('DISCORD_CLIENT_SECRET', 'discordClientSecretEnc');
    const redirectUri = `${getDashboardBaseUrl(req)}/api/auth/discord/callback`;

    const tokenRes = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: redirectUri
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 }
    );

    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
      timeout: 10000
    });
    const dUser = userRes.data;
    const discordId = String(dUser.id);
    const discordTag = dUser.discriminator && dUser.discriminator !== '0' ? `${dUser.username}#${dUser.discriminator}` : dUser.username;

    if (parsed.mode === 'owner') {
      if (!isSoleOwner(discordId)) {
        return { success: false, error: 'Access Denied: Only the Sole Bot Owner can sign in as Owner.' };
      }
      return this._issueSession('owner', discordId, discordTag, 12 * 60 * 60 * 1000);
    }

    const check = this.validatePendingInvite(parsed.token);
    if (!check.valid) return { success: false, error: check.reason };
    if (!DevSecrets.safeEqual(discordId, check.invite.targetDiscordId)) {
      ActivityLogger.record({
        actorRole: 'anonymous',
        actorId: discordId,
        actorTag: discordTag,
        action: 'AUTH_FAILED',
        summary: `Discord OAuth account ${discordTag} (${discordId}) rejected — invite is bound to ${check.invite.targetDiscordId}.`
      });
      return { success: false, error: `This invite is bound to another verified Discord account (${check.invite.targetDiscordId}).` };
    }

    const state = loadState();
    return this._completeDeveloperBinding(state, discordId, discordTag, 'DISCORD_OAUTH2', client);
  },

  async _completeDeveloperBinding(state, discordId, discordTag, method, client) {
    const now = Date.now();
    // Single-use invite consumption + invalidate previous developer sessions
    if (state.pendingInvite) {
      state.pendingInvite.used = true;
      state.pendingInvite.usedAt = now;
      state.pendingInvite.otpHash = null;
    }

    state.sessions = (state.sessions || []).filter(s => s.role === 'owner');
    state.developer = {
      discordId: String(discordId),
      discordTag: String(discordTag || discordId),
      status: 'active',
      boundAt: now,
      revokedAt: null,
      authMethod: method,
      invitedBy: state.pendingInvite?.createdBy || getSoleOwnerIds()[0]
    };

    const rawSessId = DevSecrets.generateToken(32);
    const sessionTtl = 12 * 60 * 60 * 1000;
    state.sessions.push({
      idHash: DevSecrets.hashToken(rawSessId),
      role: 'developer',
      discordId: state.developer.discordId,
      discordTag: state.developer.discordTag,
      createdAt: now,
      expiresAt: now + sessionTtl
    });
    saveState(state);

    ActivityLogger.record({
      actorRole: 'developer',
      actorId: state.developer.discordId,
      actorTag: state.developer.discordTag,
      action: 'AUTH_VERIFIED',
      summary: `Trusted Developer ${state.developer.discordTag} authenticated via ${method} (invite consumed).`
    });
    ActivityLogger.notifyOwnerDm(
      client,
      '🔐 Trusted Developer Signed In',
      `**Developer:** \`${state.developer.discordTag}\` (\`${state.developer.discordId}\`)\n**Method:** \`${method}\`\n**Scope:** Maintenance Workspace only (Owner/Secrets locked)`
    ).catch(() => {});

    return {
      success: true,
      role: 'developer',
      discordId: state.developer.discordId,
      discordTag: state.developer.discordTag,
      cookieValue: DevSecrets.signPayload(rawSessId),
      maxAgeSec: Math.floor(sessionTtl / 1000)
    };
  },

  // Owner DM Login Link & DM OTP
  async createOwnerOneTimeLink(ownerUserId, req = null) {
    if (!isSoleOwner(ownerUserId)) throw new Error('Only the Sole Bot Owner can create an Owner login link.');
    const rawToken = DevSecrets.generateToken(32);
    const now = Date.now();
    const state = loadState();
    state.ownerOneTimeLink = {
      tokenHash: DevSecrets.hashToken(rawToken),
      targetDiscordId: String(ownerUserId),
      expiresAt: now + 10 * 60 * 1000,
      used: false
    };
    saveState(state);
    return `${getDashboardBaseUrl(req)}/api/auth/owner-claim?token=${encodeURIComponent(rawToken)}`;
  },

  claimOwnerOneTimeLink(rawToken) {
    const state = loadState();
    const rec = state.ownerOneTimeLink;
    if (!rec || rec.used || Date.now() > rec.expiresAt) return { success: false, error: 'Owner login link expired or already used.' };
    if (!DevSecrets.safeEqual(DevSecrets.hashToken(rawToken), rec.tokenHash)) return { success: false, error: 'Invalid owner token.' };
    rec.used = true;
    saveState(state);
    return this._issueSession('owner', rec.targetDiscordId, 'Sole Owner');
  },

  async sendOwnerDmOtp(client, submittedDiscordId) {
    const cleanId = String(submittedDiscordId || '').replace(/[<@!>]/g, '').trim();
    if (!isSoleOwner(cleanId)) return { success: false, error: 'Only the Sole Bot Owner can request Owner login.' };
    if (!client?.isReady?.()) return { success: false, error: 'Discord Bot not connected.' };
    const otp = DevSecrets.generateOtp();
    const state = loadState();
    state.ownerChallenge = {
      targetDiscordId: cleanId,
      otpHash: DevSecrets.hashToken(otp),
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0
    };
    saveState(state);
    const u = await client.users.fetch(cleanId);
    await u.send(`👑 **KIKI Sole Owner Console 2FA Code:** \`${otp}\` *(valid 5 mins)*`);
    return { success: true };
  },

  async verifyOwnerDmOtp(client, submittedDiscordId, otpCode) {
    const cleanId = String(submittedDiscordId || '').replace(/[<@!>]/g, '').trim();
    if (!isSoleOwner(cleanId)) return { success: false, error: 'Unauthorized.' };
    const state = loadState();
    const ch = state.ownerChallenge;
    if (!ch || Date.now() > ch.expiresAt || ch.targetDiscordId !== cleanId) {
      return { success: false, error: 'Owner OTP expired. Request again.' };
    }
    if ((ch.attempts || 0) >= 5) {
      state.ownerChallenge = null;
      saveState(state);
      return { success: false, error: 'Too many attempts.' };
    }
    if (!DevSecrets.safeEqual(DevSecrets.hashToken(String(otpCode || '').trim()), ch.otpHash)) {
      ch.attempts = (ch.attempts || 0) + 1;
      saveState(state);
      return { success: false, error: 'Incorrect OTP code.' };
    }
    state.ownerChallenge = null;
    saveState(state);
    let tag = 'Sole Owner';
    try {
      const u = client?.isReady?.() ? await client.users.fetch(cleanId) : null;
      if (u) tag = u.tag || u.username;
    } catch {}
    return this._issueSession('owner', cleanId, tag);
  },

  _issueSession(role, discordId, discordTag, ttlMs = 12 * 60 * 60 * 1000) {
    const state = loadState();
    const now = Date.now();
    const rawSessId = DevSecrets.generateToken(32);
    state.sessions.push({
      idHash: DevSecrets.hashToken(rawSessId),
      role,
      discordId: String(discordId),
      discordTag: String(discordTag || role),
      createdAt: now,
      expiresAt: now + ttlMs
    });
    saveState(state);
    ActivityLogger.record({
      actorRole: role,
      actorId: String(discordId),
      actorTag: String(discordTag || role),
      action: 'AUTH_VERIFIED',
      summary: `${role === 'owner' ? 'Sole Owner' : 'Developer'} session started.`
    });
    return {
      success: true,
      role,
      discordId: String(discordId),
      discordTag: String(discordTag),
      cookieValue: DevSecrets.signPayload(rawSessId),
      maxAgeSec: Math.floor(ttlMs / 1000)
    };
  },

  authenticateCookie(cookieVal) {
    const rawSessId = DevSecrets.verifySignedPayload(cookieVal);
    if (!rawSessId) return null;
    const state = loadState();
    const idHash = DevSecrets.hashToken(rawSessId);
    const now = Date.now();
    const sess = (state.sessions || []).find(s => DevSecrets.safeEqual(s.idHash, idHash) && s.expiresAt > now);
    if (!sess) return null;

    if (sess.role === 'owner') {
      if (!isSoleOwner(sess.discordId)) return null;
      return sess;
    }

    if (sess.role === 'developer') {
      if (!state.developer || state.developer.status !== 'active') return null;
      if (!DevSecrets.safeEqual(state.developer.discordId, sess.discordId)) return null;
      return sess;
    }

    return null;
  },

  logoutSession(cookieVal) {
    const rawSessId = DevSecrets.verifySignedPayload(cookieVal);
    if (!rawSessId) return;
    const state = loadState();
    const idHash = DevSecrets.hashToken(rawSessId);
    state.sessions = (state.sessions || []).filter(s => !DevSecrets.safeEqual(s.idHash, idHash));
    saveState(state);
  },

  revokeDeveloper(ownerUserId, reason = 'Revoked by Sole Owner') {
    if (!isSoleOwner(ownerUserId)) {
      throw new Error('Unauthorized: Only the Sole Bot Owner can revoke developer access.');
    }
    const state = loadState();
    const prevDev = state.developer;
    const now = Date.now();
    if (state.developer) {
      state.developer.status = 'revoked';
      state.developer.revokedAt = now;
    }
    state.pendingInvite = null;
    // Destroy ALL developer sessions immediately
    state.sessions = (state.sessions || []).filter(s => s.role === 'owner');
    saveState(state);

    ActivityLogger.record({
      actorRole: 'owner',
      actorId: String(ownerUserId),
      actorTag: 'Sole Owner',
      action: 'DEV_REVOKED',
      summary: `Revoked Trusted Developer access (${prevDev?.discordTag || prevDev?.discordId || 'none'}): ${reason}`
    });

    return { revoked: true, previousDeveloper: prevDev };
  },

  setUrgentAutoDeploy(ownerUserId, enabled) {
    if (!isSoleOwner(ownerUserId)) {
      throw new Error('Unauthorized: Only Sole Owner can toggle urgent auto-deploy.');
    }
    const state = loadState();
    state.settings.urgentAutoDeploy = Boolean(enabled);
    saveState(state);
    ActivityLogger.record({
      actorRole: 'owner',
      actorId: String(ownerUserId),
      actorTag: 'Sole Owner',
      action: 'OWNER_SETTING_CHANGED',
      summary: `Urgent Auto-Deploy set to ${state.settings.urgentAutoDeploy ? 'ENABLED' : 'DISABLED'}.`
    });
    return state.settings;
  },

  // Owner-only AES-256-GCM encrypted integration settings (NEVER returns decrypted secrets)
  saveOwnerIntegrations(ownerUserId, payload = {}) {
    if (!isSoleOwner(ownerUserId)) throw new Error('Unauthorized.');
    const state = loadState();
    if (!state.vault) state.vault = {};
    if (payload.dashboardBaseUrl !== undefined) state.vault.dashboardBaseUrl = String(payload.dashboardBaseUrl || '').trim();
    if (payload.githubRepo) state.vault.githubRepo = String(payload.githubRepo).trim();
    if (payload.githubAppId) state.vault.githubAppId = String(payload.githubAppId).trim();
    if (payload.githubInstallationId) state.vault.githubInstallationId = String(payload.githubInstallationId).trim();
    if (payload.githubPrivateKey) state.vault.githubPrivateKeyEnc = DevSecrets.encryptSecret(payload.githubPrivateKey);
    if (payload.githubToken) state.vault.githubTokenEnc = DevSecrets.encryptSecret(payload.githubToken);
    if (payload.railwayToken) state.vault.railwayTokenEnc = DevSecrets.encryptSecret(payload.railwayToken);
    if (payload.railwayProjectId) state.vault.railwayProjectId = String(payload.railwayProjectId).trim();
    if (payload.railwayServiceId) state.vault.railwayServiceId = String(payload.railwayServiceId).trim();
    if (payload.railwayEnvironmentId) state.vault.railwayEnvironmentId = String(payload.railwayEnvironmentId).trim();
    if (payload.discordClientSecret) state.vault.discordClientSecretEnc = DevSecrets.encryptSecret(payload.discordClientSecret);
    if (payload.aiApiKey) state.vault.aiApiKeyEnc = DevSecrets.encryptSecret(payload.aiApiKey);
    saveState(state);

    ActivityLogger.record({
      actorRole: 'owner',
      actorId: String(ownerUserId),
      actorTag: 'Sole Owner',
      action: 'OWNER_INTEGRATION_UPDATED',
      summary: 'Updated encrypted integration configuration.'
    });
    return true;
  },

  getPublicSafeStatus(req = null) {
    const state = loadState();
    const inv = state.pendingInvite;
    const pendingActive = Boolean(inv && !inv.used && Date.now() <= inv.expiresAt);
    return {
      soleOwnerIds: getSoleOwnerIds(),
      developer: state.developer ? {
        discordId: state.developer.discordId,
        discordTag: state.developer.discordTag,
        status: state.developer.status,
        boundAt: state.developer.boundAt,
        revokedAt: state.developer.revokedAt,
        authMethod: state.developer.authMethod
      } : null,
      pendingInvite: pendingActive ? {
        id: inv.id,
        targetDiscordId: inv.targetDiscordId,
        targetTag: inv.targetTag,
        expiresAt: inv.expiresAt
      } : null,
      settings: state.settings,
      authModes: {
        discordBotDm2fa: true,
        discordOAuth2: this.hasOAuthConfigured()
      },
      dashboardBaseUrl: getDashboardBaseUrl(req)
    };
  }
};

module.exports = DevAccess;
