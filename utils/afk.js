// KIKI Bot - AFK Status Manager (Per-Guild + Atomic Persistence)
const fs = require('fs');
const path = require('path');
const CloudSync = require('./cloudSync.js');

const LEGACY_AFK_FILE = path.join(__dirname, '..', 'data', 'afk.json');

function getAfkFile() {
  const target = CloudSync.getDataFile('afk.json');
  if (!fs.existsSync(target) && fs.existsSync(LEGACY_AFK_FILE)) {
    try {
      const legacy = CloudSync.readJsonSafe(LEGACY_AFK_FILE, null);
      if (legacy && typeof legacy === 'object') CloudSync.writeJsonAtomic(target, legacy);
    } catch {}
  }
  return target;
}

function loadAfk() {
  const data = CloudSync.readJsonSafe(getAfkFile(), null);
  return (data && typeof data === 'object') ? data : {};
}

function saveAfk(data) {
  CloudSync.writeJsonAtomic(getAfkFile(), data);
}

module.exports = {
  setAfk(guildId, userId, reason = 'AFK') {
    const data = loadAfk();
    if (!data[guildId]) data[guildId] = {};
    const entry = { reason: String(reason || 'AFK').slice(0, 200), since: Date.now() };
    data[guildId][userId] = entry;
    saveAfk(data);
    return entry;
  },

  clearAfk(guildId, userId) {
    const data = loadAfk();
    const existing = data[guildId]?.[userId] || null;
    if (!existing) return null;
    delete data[guildId][userId];
    saveAfk(data);
    return existing;
  },

  getAfk(guildId, userId) {
    const data = loadAfk();
    return data[guildId]?.[userId] || null;
  }
};
