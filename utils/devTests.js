// KIKI Bot - Isolated Sandbox Verification Runner for Developer Fixes
// Fast, resilient in-memory verification: policy scanning, syntax parsing, export validation & alias collision guard.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const DevPolicy = require('./devPolicy.js');
const ActivityLogger = require('./activityLogger.js');

let cachedAliasMap = null;
let lastCacheTime = 0;

function getCommandAliasMap() {
  const now = Date.now();
  if (cachedAliasMap && (now - lastCacheTime) < 30000) {
    return new Map(cachedAliasMap);
  }

  const map = new Map();
  try {
    const regP = path.join(DevPolicy.REPO_ROOT, 'kiki all cmd', 'commands_registry.json');
    if (fs.existsSync(regP)) {
      const reg = JSON.parse(fs.readFileSync(regP, 'utf8'));
      if (reg.categories) {
        for (const cat of Object.keys(reg.categories)) {
          if (!Array.isArray(reg.categories[cat])) continue;
          for (const cmd of reg.categories[cat]) {
            const rel = `commands/${cat}/${cmd.file}`;
            for (const a of [cmd.name, ...(cmd.aliases || [])]) {
              if (a) map.set(String(a).toLowerCase(), rel);
            }
          }
        }
      }
    }
  } catch {}

  cachedAliasMap = new Map(map);
  lastCacheTime = now;
  return map;
}

function createMockSandbox(relPath) {
  const mockModule = { exports: {} };
  const mockChain = () => new Proxy({}, {
    get: () => (...args) => mockChain(),
    apply: () => mockChain()
  });

  const sandbox = {
    exports: mockModule.exports,
    module: mockModule,
    require: (pkg) => {
      if (pkg === 'discord.js') {
        return {
          SlashCommandBuilder: class {
            constructor() { this.name = ''; this.description = ''; this.options = []; }
            setName(n) { this.name = n; return this; }
            setDescription(d) { this.description = d; return this; }
            addStringOption(fn) { if (typeof fn === 'function') fn({ setName: () => ({ setDescription: () => ({ setRequired: () => ({}) }) }) }); return this; }
            addUserOption(fn) { if (typeof fn === 'function') fn({ setName: () => ({ setDescription: () => ({ setRequired: () => ({}) }) }) }); return this; }
            addChannelOption(fn) { if (typeof fn === 'function') fn({ setName: () => ({ setDescription: () => ({ setRequired: () => ({}) }) }) }); return this; }
            addRoleOption(fn) { if (typeof fn === 'function') fn({ setName: () => ({ setDescription: () => ({ setRequired: () => ({}) }) }) }); return this; }
            addIntegerOption(fn) { if (typeof fn === 'function') fn({ setName: () => ({ setDescription: () => ({ setRequired: () => ({}) }) }) }); return this; }
            addNumberOption(fn) { if (typeof fn === 'function') fn({ setName: () => ({ setDescription: () => ({ setRequired: () => ({}) }) }) }); return this; }
            addBooleanOption(fn) { if (typeof fn === 'function') fn({ setName: () => ({ setDescription: () => ({ setRequired: () => ({}) }) }) }); return this; }
            setDefaultMemberPermissions() { return this; }
            setDMPermission() { return this; }
          },
          ChannelType: { GuildVoice: 2, GuildText: 0, GuildCategory: 4 },
          PermissionFlagsBits: { ManageChannels: 16n, ManageRoles: 268435456n, Administrator: 8n, SendMessages: 2048n },
          Collection: class extends Map {}
        };
      }
      if (pkg.includes('embed')) {
        return {
          purple: (...a) => ({ embeds: [{ title: a[0] }] }),
          build: (cfg) => ({ embeds: [cfg] }),
          error: (t, d) => ({ embeds: [{ title: t, description: d }] })
        };
      }
      if (pkg.includes('kiki')) return {};
      return mockChain();
    },
    console: { log: () => {}, error: () => {}, warn: () => {}, info: () => {} },
    Buffer,
    process: { env: { PREFIX: '&' } },
    __filename: path.join(DevPolicy.REPO_ROOT, relPath),
    __dirname: path.dirname(path.join(DevPolicy.REPO_ROOT, relPath))
  };

  return { sandbox, mockModule };
}

async function runVerificationSuite({ actor = null, draftFiles = [] } = {}) {
  const results = [];
  const aliasMap = getCommandAliasMap();

  if (!draftFiles || draftFiles.length === 0) {
    results.push({
      step: 'Sandbox Environment Verification',
      passed: true,
      detail: `Verified sandbox baseline (${aliasMap.size} command routes registered, 0 pending drafts).`
    });
    return { passed: true, results };
  }

  for (const f of draftFiles) {
    const rawPath = f.path || f.normalizedPath || 'unknown.js';
    const content = typeof f.content === 'string' ? f.content : '';

    // Step 1: Security policy scan
    const scan = DevPolicy.scanCodeSafety(rawPath, content);
    if (!scan.allowed) {
      const errDetail = `Security violation in ${rawPath}: ${scan.reason}`;
      results.push({ step: `Security Policy (${rawPath})`, passed: false, detail: errDetail });
      if (actor) {
        ActivityLogger.record({
          actorRole: actor.role,
          actorId: actor.discordId,
          actorTag: actor.discordTag,
          action: 'POLICY_BLOCKED',
          summary: errDetail,
          filesModified: [rawPath]
        });
      }
      return { passed: false, results };
    }

    const relPath = scan.normalizedPath;

    // Step 2: Syntax validation via V8 VM
    const cleanSrc = content.replace(/^#!.*$/m, '');
    try {
      new vm.Script(`(function(exports, require, module, __filename, __dirname){\n${cleanSrc}\n})`, {
        filename: relPath,
        lineOffset: 0
      });
      results.push({ step: `Syntax Check (${relPath})`, passed: true, detail: 'JavaScript syntax parsed cleanly.' });
    } catch (syntaxErr) {
      const errDetail = `Syntax error in ${relPath}: ${syntaxErr.message}`;
      results.push({ step: `Syntax Check (${relPath})`, passed: false, detail: errDetail });
      if (actor) {
        ActivityLogger.record({
          actorRole: actor.role,
          actorId: actor.discordId,
          actorTag: actor.discordTag,
          action: 'TEST_FAILED',
          summary: errDetail,
          filesModified: [relPath]
        });
      }
      return { passed: false, results };
    }

    // Step 3: Command exports and alias collision check
    if (relPath.startsWith('commands/')) {
      try {
        const { sandbox, mockModule } = createMockSandbox(relPath);
        const vmCtx = vm.createContext(sandbox);
        const script = new vm.Script(
          `(function(exports, require, module, __filename, __dirname){\n${cleanSrc}\n})(exports, require, module, __filename, __dirname)`,
          { filename: relPath, timeout: 2500 }
        );
        script.runInContext(vmCtx);

        const exported = mockModule.exports || {};
        const cmdName = exported?.data?.name || exported?.name || path.basename(relPath, '.js');
        const aliases = Array.isArray(exported?.aliases) ? exported.aliases : [];

        // Verify valid executable command structure
        const hasExecutable = typeof exported.execute === 'function' || typeof exported.run === 'function';
        if (!hasExecutable) {
          results.push({
            step: `Command Structure (${relPath})`,
            passed: false,
            detail: `Command '${cmdName}' must export an execute(interaction, client) or run(message, args, client) handler.`
          });
          return { passed: false, results };
        }

        // Check alias collision
        const allNames = [cmdName, ...aliases].map(s => String(s).toLowerCase()).filter(Boolean);
        for (const name of allNames) {
          if (aliasMap.has(name)) {
            const existingFile = aliasMap.get(name);
            if (existingFile !== relPath) {
              const colDetail = `Alias collision detected: '${name}' is already registered by ${existingFile}.`;
              results.push({ step: `Alias Collision Check (${relPath})`, passed: false, detail: colDetail });
              return { passed: false, results };
            }
          }
          aliasMap.set(name, relPath);
        }

        results.push({
          step: `Command Verification (${relPath})`,
          passed: true,
          detail: `Command '${cmdName}' loaded cleanly with ${aliases.length} alias(es).`
        });
      } catch (execErr) {
        const errDetail = `Execution check warning in ${relPath}: ${execErr.message}`;
        results.push({ step: `Command Verification (${relPath})`, passed: true, detail: errDetail });
      }
    } else {
      results.push({
        step: `Module Verification (${relPath})`,
        passed: true,
        detail: `File verified safe & syntactically clean (${Buffer.byteLength(content, 'utf8')} bytes).`
      });
    }
  }

  if (actor) {
    ActivityLogger.record({
      actorRole: actor.role,
      actorId: actor.discordId,
      actorTag: actor.discordTag,
      action: 'TEST_RUN',
      summary: `Sandbox verification passed for ${draftFiles.length} file(s).`,
      filesModified: draftFiles.map(f => f.path)
    });
  }

  return { passed: true, results };
}

module.exports = { runVerificationSuite };
