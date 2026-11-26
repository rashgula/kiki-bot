// KIKI Bot - Cryptographic Utilities for Trusted Developer Access
// AES-256-GCM authenticated encryption, HMAC-SHA256 signing & constant-time comparisons.

const crypto = require('crypto');

let runtimeEphemeralSalt = null;

function getMasterKey() {
  const explicit = process.env.DEV_MASTER_SECRET || process.env.SESSION_SECRET;
  const fallbackMaterial = process.env.TOKEN || process.env.DISCORD_TOKEN || process.env.BOT_TOKEN || '';
  if (explicit && explicit.length >= 16) {
    return crypto.createHash('sha256').update(`kiki-dev-master:${explicit}`).digest();
  }
  if (fallbackMaterial) {
    return crypto.scryptSync(fallbackMaterial, 'kiki-trusted-dev-vault-v1', 32);
  }
  if (!runtimeEphemeralSalt) {
    runtimeEphemeralSalt = crypto.randomBytes(32);
  }
  return runtimeEphemeralSalt;
}

function hashToken(raw) {
  return crypto.createHash('sha256').update(String(raw || '')).digest('hex');
}

function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a || ''), 'utf8');
  const bufB = Buffer.from(String(b || ''), 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function signPayload(payloadStr) {
  const sig = crypto.createHmac('sha256', getMasterKey()).update(payloadStr).digest('base64url');
  return `${payloadStr}.${sig}`;
}

function verifySignedPayload(signedToken) {
  if (!signedToken || typeof signedToken !== 'string') return null;
  const idx = signedToken.lastIndexOf('.');
  if (idx <= 0) return null;
  const payload = signedToken.slice(0, idx);
  const sig = signedToken.slice(idx + 1);
  const expected = crypto.createHmac('sha256', getMasterKey()).update(payload).digest('base64url');
  if (!safeEqual(sig, expected)) return null;
  return payload;
}

function encryptSecret(plaintext) {
  if (!plaintext) return null;
  const key = getMasterKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

function decryptSecret(blob) {
  if (!blob || typeof blob !== 'string') return null;
  try {
    const parts = blob.split('.');
    if (parts.length !== 3) return null;
    const iv = Buffer.from(parts[0], 'base64url');
    const tag = Buffer.from(parts[1], 'base64url');
    const enc = Buffer.from(parts[2], 'base64url');
    const decipher = crypto.createDecipheriv('aes-256-gcm', getMasterKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

function redactSecrets(text) {
  let out = String(text || '');
  const envSecrets = [
    process.env.TOKEN,
    process.env.DISCORD_TOKEN,
    process.env.BOT_TOKEN,
    process.env.DISCORD_CLIENT_SECRET,
    process.env.GITHUB_TOKEN,
    process.env.GITHUB_PRIVATE_KEY,
    process.env.RAILWAY_API_TOKEN,
    process.env.DEV_MASTER_SECRET,
    process.env.GEMINI_API_KEY,
    process.env.OPENAI_API_KEY
  ].filter(v => v && String(v).length > 6);

  for (const s of envSecrets) {
    out = out.split(String(s)).join('[REDACTED_SECRET]');
  }
  return out;
}

module.exports = {
  hashToken,
  generateToken,
  generateOtp,
  safeEqual,
  signPayload,
  verifySignedPayload,
  encryptSecret,
  decryptSecret,
  redactSecrets
};
