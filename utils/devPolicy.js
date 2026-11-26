// KIKI Bot - Strict Developer Path & Code Security Policy Guard
// Prevents the trusted developer from reading/editing secrets, auth logic, databases, or protected infrastructure.

const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');

// Strictly protected files/directories (NEVER writable by developer, many also unreadable)
const UNREADABLE_PREFIXES = [
  '.env',
  '.git/',
  '.git\\',
  'data/dev_access.json',
  'node_modules/'
];

const PROTECTED_WRITE_EXACT = new Set([
  'config.js',
  'config.json',
  'index.js',
  'package.json',
  'package-lock.json',
  'railway.json',
  'procfile',
  'deploy-commands.js',
  'utils/kiki.js',
  'utils/cloudSync.js',
  'utils/devAccess.js',
  'utils/devPolicy.js',
  'utils/devSecrets.js',
  'utils/devAi.js',
  'utils/devTests.js',
  'utils/activityLogger.js',
  'utils/githubIntegration.js',
  'utils/railwayIntegration.js',
  'utils/maintenanceServer.js',
  'utils/commandAutoExec.js',
  'commands/admin/devaccess.js'
]);

const PROTECTED_WRITE_PREFIXES = [
  '.env',
  '.git/',
  '.github/',
  'data/',
  'node_modules/',
  'public/',
  'commands/antinuke/',
  'commands/nuke/'
];

const ALLOWED_WRITE_PREFIXES = [
  'commands/',
  'events/',
  'utils/'
];

// Destructive or credential-exfiltrating patterns rejected inside developer edits
const FORBIDDEN_CODE_PATTERNS = [
  { regex: /process\.env\.(TOKEN|DISCORD_TOKEN|BOT_TOKEN|RAILWAY_API_TOKEN|GITHUB_TOKEN|GITHUB_PRIVATE_KEY|DEV_MASTER_SECRET|DISCORD_CLIENT_SECRET|OPENAI_API_KEY|GEMINI_API_KEY)/i, reason: 'Direct access to protected environment secrets is forbidden.' },
  { regex: /child_process|execSync|spawnSync|\.exec\s*\(/i, reason: 'Arbitrary shell/process execution is forbidden inside maintenance edits.' },
  { regex: /\b(unlinkSync|rmSync|rmdirSync|unlink|rm)\s*\(/i, reason: 'Destructive filesystem deletion calls are forbidden.' },
  { regex: /\beval\s*\(|new\s+Function\s*\(/i, reason: 'Dynamic eval/Function execution is forbidden.' },
  { regex: /\.guild\.delete\s*\(/i, reason: 'Guild destruction API calls are forbidden.' },
  { regex: /devAccess|devSecrets|OWNER_IDS|cfg\.owners|isSoleOwner|isOwner\s*=/i, reason: 'Modifying owner privilege checks or auth modules is forbidden.' }
];

function normalizeRelPath(inputPath) {
  if (!inputPath || typeof inputPath !== 'string') return null;
  const cleaned = inputPath.replace(/\\/g, '/').replace(/^\/+/, '').trim();
  if (!cleaned || cleaned.includes('\0') || cleaned.includes('..')) return null;
  const resolved = path.resolve(REPO_ROOT, cleaned);
  if (!resolved.startsWith(REPO_ROOT + path.sep) && resolved !== REPO_ROOT) return null;
  return path.relative(REPO_ROOT, resolved).replace(/\\/g, '/');
}

function isReadablePath(inputPath) {
  const rel = normalizeRelPath(inputPath);
  if (!rel) return false;
  const lower = rel.toLowerCase();
  if (UNREADABLE_PREFIXES.some(p => lower === p || lower.startsWith(p))) return false;
  if (lower.endsWith('.json') && lower.startsWith('data/dev_')) return false;
  return lower.endsWith('.js') || lower.endsWith('.md') || lower.endsWith('.json') || lower.endsWith('.html');
}

function isEditablePath(inputPath) {
  const rel = normalizeRelPath(inputPath);
  if (!rel) return false;
  const lower = rel.toLowerCase();

  if (PROTECTED_WRITE_EXACT.has(rel) || PROTECTED_WRITE_EXACT.has(lower)) return false;
  if (PROTECTED_WRITE_PREFIXES.some(p => lower.startsWith(p))) return false;
  if (!ALLOWED_WRITE_PREFIXES.some(p => lower.startsWith(p))) return false;
  if (!lower.endsWith('.js')) return false;

  return true;
}

function scanCodeSafety(inputPath, code) {
  const rel = normalizeRelPath(inputPath);
  if (!rel || !isEditablePath(rel)) {
    return { allowed: false, reason: `Protected path '${inputPath}' cannot be modified or created by Trusted Developer.` };
  }
  if (typeof code !== 'string' || !code.trim()) {
    return { allowed: false, reason: 'File content cannot be empty (deletions are disabled).' };
  }
  if (code.length > 250000) {
    return { allowed: false, reason: 'File exceeds maximum 250KB edit size.' };
  }

  for (const rule of FORBIDDEN_CODE_PATTERNS) {
    if (rule.regex.test(code)) {
      return { allowed: false, reason: `Security Policy Violation: ${rule.reason}` };
    }
  }

  return { allowed: true, normalizedPath: rel };
}

module.exports = {
  REPO_ROOT,
  normalizeRelPath,
  isReadablePath,
  isEditablePath,
  scanCodeSafety
};
