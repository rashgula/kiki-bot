// KIKI Bot - Activity & Security Audit Log System
// Records every invite, authentication, file modification, test run, GitHub PR, and Railway deploy.

const fs = require('fs');
const path = require('path');
const CloudSync = require('./cloudSync.js');
const DevSecrets = require('./devSecrets.js');

const LEGACY_LOG_FILE = path.join(__dirname, '..', 'data', 'dev_activity_logs.json');
const MAX_LOGS = 500;

function getLogFile() {
  return CloudSync.getDataFile('dev_activity_logs.json');
}

function loadLogs() {
  const data = CloudSync.readJsonSafe(getLogFile(), null);
  if (data && Array.isArray(data.entries)) return data.entries;
  if (!process.env.DATA_DIR && fs.existsSync(LEGACY_LOG_FILE)) {
    const legacy = CloudSync.readJsonSafe(LEGACY_LOG_FILE, null);
    if (legacy && Array.isArray(legacy.entries)) return legacy.entries;
  }
  return [];
}

function saveLogs(entries) {
  const trimmed = entries.slice(0, MAX_LOGS);
  CloudSync.writeJsonAtomic(getLogFile(), { updatedAt: Date.now(), entries: trimmed });
}

const ActivityLogger = {
  record(entry = {}) {
    const entries = loadLogs();
    const record = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      epochMs: Date.now(),
      actorRole: entry.actorRole || 'system',
      actorId: entry.actorId ? String(entry.actorId) : null,
      actorTag: entry.actorTag || 'System',
      action: entry.action || 'EVENT',
      summary: DevSecrets.redactSecrets(entry.summary || ''),
      errorFixed: DevSecrets.redactSecrets(entry.errorFixed || ''),
      filesModified: Array.isArray(entry.filesModified) ? entry.filesModified.slice(0, 50) : [],
      github: entry.github || null,
      railway: entry.railway || null,
      ip: entry.ip || null
    };
    entries.unshift(record);
    saveLogs(entries);
    return record;
  },

  getRecent(limit = 50) {
    return loadLogs().slice(0, Math.min(Math.max(1, Number(limit) || 50), MAX_LOGS));
  },

  async notifyOwnerDm(client, title, description) {
    if (!client || !client.isReady?.()) return false;
    try {
      const config = require('../config.js');
      const ownerId = (config.OWNER_IDS && config.OWNER_IDS[0]) || '989411027798089778';
      const owner = await client.users.fetch(ownerId).catch(() => null);
      if (!owner) return false;
      const KikiEmbed = require('./embed.js');
      await owner.send({
        embeds: [KikiEmbed.purple(title, DevSecrets.redactSecrets(description))]
      }).catch(() => {});
      return true;
    } catch {
      return false;
    }
  }
};

module.exports = ActivityLogger;
