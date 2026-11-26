// KIKI Bot - Social Profiles, Reputation & Birthdays Engine
const fs = require('fs');
const path = require('path');
const CloudSync = require('./cloudSync.js');

const LEGACY_SOCIAL_FILE = path.join(__dirname, '..', 'data', 'social.json');

function getSocialFile() {
  const target = CloudSync.getDataFile('social.json');
  if (!fs.existsSync(target) && fs.existsSync(LEGACY_SOCIAL_FILE)) {
    try {
      const legacy = CloudSync.readJsonSafe(LEGACY_SOCIAL_FILE, null);
      if (legacy && typeof legacy === 'object') CloudSync.writeJsonAtomic(target, legacy);
    } catch {}
  }
  return target;
}

function loadSocial() {
  const data = CloudSync.readJsonSafe(getSocialFile(), null);
  return (data && typeof data === 'object' && data.guilds) ? data : { guilds: {} };
}

function saveSocial(data) {
  CloudSync.writeJsonAtomic(getSocialFile(), data);
}

const COLOR_PRESETS = {
  purple: 0x9B59B6,
  violet: 0x8E44AD,
  crimson: 0xE74C3C,
  red: 0xE74C3C,
  gold: 0xF1C40F,
  teal: 0x1ABC9C,
  blue: 0x3498DB,
  pink: 0xE91E63,
  green: 0x2ECC71,
  black: 0x1A1A1A,
  obsidian: 0x2C2F33
};

module.exports = {
  saveNow() {
    saveSocial(loadSocial());
  },

  _ensure(data, guildId, userId) {
    if (!data.guilds[guildId]) data.guilds[guildId] = { profiles: {} };
    if (!data.guilds[guildId].profiles) data.guilds[guildId].profiles = {};
    if (!data.guilds[guildId].profiles[userId]) {
      data.guilds[guildId].profiles[userId] = {
        bio: 'Walking the gothic shadows with KIKI.',
        color: 0x9B59B6,
        title: '🌙 Night Wanderer',
        rep: 0,
        lastRepGiven: 0,
        birthday: null
      };
    }
    return data.guilds[guildId].profiles[userId];
  },

  getProfile(guildId, userId) {
    const data = loadSocial();
    return this._ensure(data, guildId || 'global', userId);
  },

  setBio(guildId, userId, bio) {
    const data = loadSocial();
    const p = this._ensure(data, guildId || 'global', userId);
    p.bio = String(bio || 'Walking the gothic shadows.').slice(0, 220);
    saveSocial(data);
    return p;
  },

  setTitle(guildId, userId, title) {
    const data = loadSocial();
    const p = this._ensure(data, guildId || 'global', userId);
    p.title = String(title || '🌙 Night Wanderer').slice(0, 60);
    saveSocial(data);
    return p;
  },

  setColor(guildId, userId, input) {
    const raw = String(input || '').trim().toLowerCase();
    let hexNum = null;
    if (COLOR_PRESETS[raw] !== undefined) {
      hexNum = COLOR_PRESETS[raw];
    } else {
      const m = raw.match(/^#?([0-9a-f]{6})$/i);
      if (m) hexNum = parseInt(m[1], 16);
    }
    if (hexNum === null || isNaN(hexNum)) {
      return { success: false, message: `Invalid color! Use hex like \`#9B59B6\` ya preset: ${Object.keys(COLOR_PRESETS).join(', ')}` };
    }
    const data = loadSocial();
    const p = this._ensure(data, guildId || 'global', userId);
    p.color = hexNum;
    saveSocial(data);
    return { success: true, color: hexNum, hex: `#${hexNum.toString(16).padStart(6, '0').toUpperCase()}` };
  },

  giveRep(guildId, giverId, targetId) {
    if (giverId === targetId) {
      return { success: false, message: 'Aap khud ko reputation point nahi de sakte!' };
    }
    const data = loadSocial();
    const gId = guildId || 'global';
    const giver = this._ensure(data, gId, giverId);
    const target = this._ensure(data, gId, targetId);
    const now = Date.now();
    const cooldown = 12 * 60 * 60 * 1000;
    const diff = now - (giver.lastRepGiven || 0);
    if (diff < cooldown) {
      return { success: false, cooldown: true, remainingMs: cooldown - diff };
    }
    giver.lastRepGiven = now;
    target.rep = (target.rep || 0) + 1;
    saveSocial(data);
    return { success: true, rep: target.rep };
  },

  setBirthday(guildId, userId, rawDate) {
    const text = String(rawDate || '').trim();
    const m = text.match(/^(\d{1,2})[\/\-.\s](\d{1,2})$/);
    if (!m) {
      return { success: false, message: 'Format: `DD-MM` ya `DD/MM` (Example: `14-02` for 14 Feb)' };
    }
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return { success: false, message: 'Valid date dein (Day 1-31, Month 1-12).' };
    }
    const data = loadSocial();
    const p = this._ensure(data, guildId || 'global', userId);
    p.birthday = { day, month };
    saveSocial(data);
    return { success: true, birthday: p.birthday };
  },

  getBirthdays(guildId, monthFilter = null) {
    const data = loadSocial();
    const profiles = data.guilds?.[guildId || 'global']?.profiles || {};
    const list = [];
    for (const [userId, prof] of Object.entries(profiles)) {
      if (prof?.birthday && (!monthFilter || prof.birthday.month === monthFilter)) {
        list.push({ userId, day: prof.birthday.day, month: prof.birthday.month });
      }
    }
    list.sort((a, b) => (a.month - b.month) || (a.day - b.day));
    return list;
  }
};
