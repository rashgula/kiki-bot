// KIKI Bot - Atomic Storage & Discord Cloud State Sync Engine
// Prevents XP/Level/Economy/Invite loss across ephemeral cloud container restarts & Git deploys!

const fs = require('fs');
const path = require('path');
const { AttachmentBuilder } = require('discord.js');
const KIKI = require('./kiki.js');

const STATE_MARKER = '☁️ **KIKI Cloud State Snapshot** *(Auto-Synced Persistent Database — Do Not Delete)*';
const DEFAULT_BACKUP_GUILD_ID = '1563548609960742942';

let cachedStateMessage = null;
let lastCloudPushAt = 0;
let cloudSyncTimer = null;
let cloudPushInFlight = false;
let cloudRestoreDone = false;

function resolveDataDir() {
  if (process.env.DATA_DIR) {
    try {
      fs.mkdirSync(process.env.DATA_DIR, { recursive: true });
      return process.env.DATA_DIR;
    } catch {}
  }
  const localDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }
  return localDir;
}

function getDataFile(filename) {
  const dir = resolveDataDir();
  const target = path.join(dir, filename);
  const seed = path.join(__dirname, '..', 'data', filename);
  if (dir !== path.join(__dirname, '..', 'data') && !fs.existsSync(target) && fs.existsSync(seed)) {
    try {
      fs.copyFileSync(seed, target);
    } catch {}
  }
  return target;
}

function writeJsonAtomic(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tmp = `${filePath}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmp, filePath);
    return true;
  } catch (err) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (e2) {
      console.error('[CLOUDSYNC ATOMIC WRITE ERROR]', filePath, e2.message);
      return false;
    }
  }
}

function readJsonSafe(filePath, fallback = {}) {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8').trim();
      if (!raw) return fallback;
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[CLOUDSYNC READ ERROR]', filePath, err.message);
  }
  return fallback;
}

function mergeGenericDict(local, remote) {
  const out = { ...(local || {}) };
  for (const [k, v] of Object.entries(remote || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) {
      out[k] = mergeGenericDict(out[k], v);
    } else if (out[k] === undefined) {
      out[k] = v;
    }
  }
  return out;
}

async function getAnchorChannel(client) {
  if (!client || !client.isReady?.()) return null;
  const preferredId = process.env.CLOUD_BACKUP_CHANNEL_ID;
  if (preferredId) {
    const ch = client.channels.cache.get(preferredId) || await client.channels.fetch(preferredId).catch(() => null);
    if (ch && ch.isTextBased()) return ch;
  }

  const primaryGuild = client.guilds.cache.get(DEFAULT_BACKUP_GUILD_ID) || client.guilds.cache.first();
  if (!primaryGuild) return null;

  return KIKI.getGuildChannel(primaryGuild, 'security_log_channel_id') ||
    KIKI.getGuildChannel(primaryGuild, 'log_channel_id') ||
    null;
}

async function findStateMessage(channel, client) {
  if (cachedStateMessage && cachedStateMessage.channelId === channel.id) {
    return cachedStateMessage;
  }
  try {
    const pinned = await channel.messages.fetchPinned().catch(() => null);
    if (pinned) {
      const hit = pinned.find(m => m.author?.id === client.user.id && (m.content?.includes('KIKI Cloud State Snapshot') || m.attachments?.some(a => a.name === 'kiki_cloud_state.json')));
      if (hit) {
        cachedStateMessage = hit;
        return hit;
      }
    }
    const recent = await channel.messages.fetch({ limit: 40 }).catch(() => null);
    if (recent) {
      const hit = recent.find(m => m.author?.id === client.user.id && (m.content?.includes('KIKI Cloud State Snapshot') || m.attachments?.some(a => a.name === 'kiki_cloud_state.json')));
      if (hit) {
        cachedStateMessage = hit;
        return hit;
      }
    }
  } catch {}
  return null;
}

const CloudSync = {
  resolveDataDir,
  getDataFile,
  writeJsonAtomic,
  readJsonSafe,

  isRestored() {
    return cloudRestoreDone;
  },

  async restoreFromDiscord(client) {
    try {
      const channel = await getAnchorChannel(client);
      if (!channel) {
        cloudRestoreDone = true;
        return false;
      }

      const msg = await findStateMessage(channel, client);
      if (!msg) {
        cloudRestoreDone = true;
        return false;
      }

      const att = msg.attachments?.find(a => a.name === 'kiki_cloud_state.json') || msg.attachments?.first();
      if (!att || !att.url) {
        cloudRestoreDone = true;
        return false;
      }

      const fetchFn = globalThis.fetch || require('node-fetch');
      const res = await fetchFn(att.url);
      if (!res.ok) {
        cloudRestoreDone = true;
        return false;
      }

      const snapshot = await res.json();
      if (!snapshot || typeof snapshot !== 'object') {
        cloudRestoreDone = true;
        return false;
      }

      // 1. Merge Levels strictly keeping highest / latest manual override
      if (snapshot.levels && typeof snapshot.levels === 'object') {
        const Leveling = require('./leveling.js');
        Leveling.mergeCloudSnapshot(snapshot.levels);
      }

      // 2. Merge Economy
      if (snapshot.economy && typeof snapshot.economy === 'object') {
        const ecoFile = getDataFile('economy.json');
        const localEco = readJsonSafe(ecoFile, { users: {}, shop: {} });
        if (!localEco.users) localEco.users = {};
        for (const [k, rUser] of Object.entries(snapshot.economy.users || {})) {
          const lUser = localEco.users[k];
          if (!lUser) {
            localEco.users[k] = rUser;
          } else {
            const lTouch = Math.max(lUser.lastDaily || 0, lUser.lastWork || 0, lUser.lastCrime || 0, lUser.lastMine || 0, lUser.lastWeekly || 0, lUser.lastMonthly || 0, lUser.updatedAt || 0);
            const rTouch = Math.max(rUser.lastDaily || 0, rUser.lastWork || 0, rUser.lastCrime || 0, rUser.lastMine || 0, rUser.lastWeekly || 0, rUser.lastMonthly || 0, rUser.updatedAt || 0);
            if (rTouch > lTouch) {
              localEco.users[k] = rUser;
            }
          }
        }
        writeJsonAtomic(ecoFile, localEco);
      }

      // 3. Merge Invites
      if (snapshot.invites && typeof snapshot.invites === 'object') {
        const invFile = getDataFile('invites.json');
        const localInv = readJsonSafe(invFile, { guilds: {} });
        if (!localInv.guilds) localInv.guilds = {};
        for (const [gid, rGuild] of Object.entries(snapshot.invites.guilds || {})) {
          if (!localInv.guilds[gid]) {
            localInv.guilds[gid] = rGuild;
          } else {
            const lGuild = localInv.guilds[gid];
            if (!lGuild.users) lGuild.users = {};
            for (const [uid, ru] of Object.entries(rGuild.users || {})) {
              const lu = lGuild.users[uid];
              if (!lu) {
                lGuild.users[uid] = ru;
              } else {
                lu.total = Math.max(lu.total || 0, ru.total || 0);
                lu.regular = Math.max(lu.regular || 0, ru.regular || 0);
                lu.left = Math.max(lu.left || 0, ru.left || 0);
                lu.fake = Math.max(lu.fake || 0, ru.fake || 0);
                lu.bonus = Math.max(lu.bonus || 0, ru.bonus || 0);
              }
            }
            lGuild.joinedMembers = { ...(rGuild.joinedMembers || {}), ...(lGuild.joinedMembers || {}) };
          }
        }
        writeJsonAtomic(invFile, localInv);
      }

      // 4. Merge Marriages, Social, Warnings, VoiceMaster Temp Channels & Dev Logs / Encrypted Auth State
      for (const [key, fname] of [
        ['marriages', 'marriages.json'],
        ['social', 'social.json'],
        ['warnings', 'warnings.json'],
        ['tempChannels', 'temp_channels.json'],
        ['devActivityLogs', 'dev_activity_logs.json']
      ]) {
        if (snapshot[key] && typeof snapshot[key] === 'object') {
          const fp = getDataFile(fname);
          const localObj = readJsonSafe(fp, {});
          if (key === 'devActivityLogs' && Array.isArray(snapshot[key].entries)) {
            const seen = new Set((localObj.entries || []).map(e => e.id));
            const combined = [...(localObj.entries || [])];
            for (const item of snapshot[key].entries) {
              if (!seen.has(item.id)) combined.push(item);
            }
            combined.sort((a, b) => (b.epochMs || 0) - (a.epochMs || 0));
            writeJsonAtomic(fp, { updatedAt: Date.now(), entries: combined.slice(0, 500) });
          } else {
            writeJsonAtomic(fp, mergeGenericDict(localObj, snapshot[key]));
          }
        }
      }
      if (snapshot.devAccess && typeof snapshot.devAccess === 'object') {
        const daFile = getDataFile('dev_access.json');
        const localDa = readJsonSafe(daFile, null);
        if (!localDa || !localDa.version) {
          writeJsonAtomic(daFile, snapshot.devAccess);
        }
      }

      cloudRestoreDone = true;
      console.log('  ☁️ [CLOUD SYNC] Successfully restored & merged persistent state from Discord Cloud Snapshot!');
      return true;
    } catch (err) {
      cloudRestoreDone = true;
      console.error('[CLOUD SYNC RESTORE ERROR]', err.message);
      return false;
    }
  },

  async pushToDiscord(client, force = false) {
    if (!client || !client.isReady?.()) return false;
    if (cloudPushInFlight) return false;

    const now = Date.now();
    if (!force && now - lastCloudPushAt < 120000) return false; // Max once per 2 min unless forced

    cloudPushInFlight = true;
    try {
      const channel = await getAnchorChannel(client);
      if (!channel) return false;

      const snapshot = {
        version: 1,
        updatedAt: now,
        levels: readJsonSafe(getDataFile('levels.json'), {}),
        economy: readJsonSafe(getDataFile('economy.json'), { users: {}, shop: {} }),
        invites: readJsonSafe(getDataFile('invites.json'), { guilds: {} }),
        marriages: readJsonSafe(getDataFile('marriages.json'), {}),
        social: readJsonSafe(getDataFile('social.json'), {}),
        warnings: readJsonSafe(getDataFile('warnings.json'), {}),
        tempChannels: readJsonSafe(getDataFile('temp_channels.json'), {}),
        devAccess: readJsonSafe(getDataFile('dev_access.json'), null),
        devActivityLogs: readJsonSafe(getDataFile('dev_activity_logs.json'), { entries: [] })
      };

      const buf = Buffer.from(JSON.stringify(snapshot), 'utf8');
      const file = new AttachmentBuilder(buf, { name: 'kiki_cloud_state.json' });
      const content = `${STATE_MARKER}\nLast Synced: <t:${Math.floor(now / 1000)}:R>`;

      const existingMsg = await findStateMessage(channel, client);
      if (existingMsg) {
        cachedStateMessage = await existingMsg.edit({ content, files: [file], attachments: [] }).catch(() => null);
      } else {
        const sent = await channel.send({ content, files: [file] }).catch(() => null);
        if (sent) {
          cachedStateMessage = sent;
          await sent.pin().catch(() => {});
        }
      }

      lastCloudPushAt = Date.now();
      return true;
    } catch (err) {
      console.error('[CLOUD SYNC PUSH ERROR]', err.message);
      return false;
    } finally {
      cloudPushInFlight = false;
    }
  },

  schedulePush(client, delayMs = 20000) {
    if (!client || cloudSyncTimer) return;
    cloudSyncTimer = setTimeout(() => {
      cloudSyncTimer = null;
      this.pushToDiscord(client, false).catch(() => {});
    }, delayMs);
  }
};

module.exports = CloudSync;
