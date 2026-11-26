// KIKI Bot - Isolated Sandbox Verification Runner for Developer Fixes
// Copies workspace metadata to a temp sandbox, strips all secrets from subprocess env, and verifies syntax + handler + collisions.

const fs = require('fs');
const path = require('path');
const os = require('os');
const vm = require('vm');
const { execFileSync } = require('child_process');
const DevPolicy = require('./devPolicy.js');
const ActivityLogger = require('./activityLogger.js');

function copyDirShallowSync(src, dest, draftMap) {
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === '.env' || ent.name === 'assets' || ent.name === 'legacy_python') continue;
    const srcP = path.join(src, ent.name);
    const dstP = path.join(dest, ent.name);
    const rel = path.relative(DevPolicy.REPO_ROOT, srcP).replace(/\\/g, '/');

    if (ent.isDirectory()) {
      copyDirShallowSync(srcP, dstP, draftMap);
    } else if (ent.isFile()) {
      if (draftMap.has(rel)) {
        fs.writeFileSync(dstP, draftMap.get(rel), 'utf8');
      } else if (!ent.name.startsWith('.env') && !rel.startsWith('data/dev_')) {
        fs.copyFileSync(srcP, dstP);
      }
    }
  }
  // Write newly created draft files that weren't yet on disk
  for (const [rel, content] of draftMap.entries()) {
    const dstP = path.join(dest, rel);
    if (!fs.existsSync(dstP)) {
      fs.mkdirSync(path.dirname(dstP), { recursive: true });
      fs.writeFileSync(dstP, content, 'utf8');
    }
  }
}

async function runVerificationSuite({ actor = null, draftFiles = [] } = {}) {
  const results = [];
  const draftMap = new Map();

  for (const f of draftFiles) {
    const scan = DevPolicy.scanCodeSafety(f.path, f.content);
    if (!scan.allowed) {
      results.push({ step: `Policy Check (${f.path})`, passed: false, detail: scan.reason });
      return { passed: false, results };
    }
    try {
      const cleanSrc = f.content.replace(/^#!.*$/m, '');
      new vm.Script(`(function(exports, require, module, __filename, __dirname){\n${cleanSrc}\n})`, { filename: scan.normalizedPath });
      results.push({ step: `Syntax & Policy (${scan.normalizedPath})`, passed: true, detail: 'Valid JS & policy clean' });
      draftMap.set(scan.normalizedPath, f.content);
    } catch (e) {
      results.push({ step: `Syntax (${scan.normalizedPath})`, passed: false, detail: e.message });
      return { passed: false, results };
    }
  }

  // Create isolated temporary sandbox copy + symlink node_modules (read-only) with zero secret env vars
  const sandboxRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kiki-devtest-'));
  try {
    copyDirShallowSync(DevPolicy.REPO_ROOT, sandboxRoot, draftMap);
    const liveNm = path.join(DevPolicy.REPO_ROOT, 'node_modules');
    const sbNm = path.join(sandboxRoot, 'node_modules');
    if (fs.existsSync(liveNm) && !fs.existsSync(sbNm)) {
      try {
        fs.symlinkSync(liveNm, sbNm, process.platform === 'win32' ? 'junction' : 'dir');
      } catch {}
    }

    const runnerScript = `
      const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
      const { Collection } = require('discord.js');
      const jsFiles = [];
      (function walk(d){
        for (const e of fs.readdirSync(d, { withFileTypes: true })) {
          if (e.name === 'node_modules' || e.name === '.git') continue;
          const p = path.join(d, e.name);
          if (e.isDirectory()) walk(p);
          else if (e.name.endsWith('.js')) jsFiles.push(p);
        }
      })(process.cwd());
      for (const f of jsFiles) {
        const src = fs.readFileSync(f, 'utf8').replace(/^#!.*$/m, '');
        new vm.Script('(function(exports,require,module,__filename,__dirname){\\n' + src + '\\n})', { filename: f });
      }
      const client = { user: { id: '999', tag: 'KIKI#0001', displayAvatarURL: () => '' }, guilds: { cache: new Collection() }, ws: { ping: 1 } };
      const errs = [];
      console.log = () => {};
      console.error = (...a) => errs.push(a.join(' '));
      require('./handlers/commandHandler.js')(client);
      assert.strictEqual(errs.length, 0, errs.join('; '));
      const seen = new Map();
      for (const cat of fs.readdirSync('commands')) {
        const cp = path.join('commands', cat);
        if (!fs.statSync(cp).isDirectory()) continue;
        for (const fn of fs.readdirSync(cp).filter(x => x.endsWith('.js'))) {
          const rel = path.join('commands', cat, fn);
          const mod = require('./' + rel);
          const names = new Set([mod.data?.name || mod.name, fn.replace('.js', ''), ...(mod.aliases || [])].filter(Boolean));
          for (const n of names) {
            const k = n.toLowerCase();
            if (seen.has(k) && seen.get(k) !== rel) throw new Error('Alias collision: ' + k + ' (' + seen.get(k) + ' <-> ' + rel + ')');
            seen.set(k, rel);
          }
        }
      }
      process.stdout.write(JSON.stringify({ ok: true, jsCount: jsFiles.length, cmdCount: client.totalCommands }));
    `;

    // Strictly sanitized env: ZERO tokens or API keys passed into test runner
    const cleanEnv = {
      PATH: process.env.PATH,
      NODE_PATH: liveNm,
      DATA_DIR: path.join(sandboxRoot, 'data'),
      PREFIX: '&'
    };

    const rawOut = execFileSync(process.execPath, ['-e', runnerScript], {
      cwd: sandboxRoot,
      env: cleanEnv,
      timeout: 60000,
      stdio: ['ignore', 'pipe', 'pipe']
    }).toString('utf8');

    const parsed = JSON.parse(rawOut);
    results.push({
      step: 'Command Loader, Syntax & Alias Verification',
      passed: true,
      detail: `Parsed ${parsed.jsCount} JS files, loaded ${parsed.cmdCount} commands, 0 collisions.`
    });

    if (actor) {
      ActivityLogger.record({
        actorRole: actor.role,
        actorId: actor.discordId,
        actorTag: actor.discordTag,
        action: 'TEST_RUN',
        summary: `Sandbox verification passed (${parsed.cmdCount} commands, ${draftMap.size} modified file(s)).`,
        filesModified: Array.from(draftMap.keys())
      });
    }
    return { passed: true, results };
  } catch (err) {
    const msg = err.stderr?.toString() || err.message;
    results.push({ step: 'Sandbox Test Failure', passed: false, detail: msg.slice(0, 1200) });
    if (actor) {
      ActivityLogger.record({
        actorRole: actor.role,
        actorId: actor.discordId,
        actorTag: actor.discordTag,
        action: 'TEST_FAILED',
        summary: `Sandbox test failed: ${msg.slice(0, 200)}`,
        filesModified: Array.from(draftMap.keys())
      });
    }
    return { passed: false, results };
  } finally {
    try { fs.rmSync(sandboxRoot, { recursive: true, force: true }); } catch {}
  }
}

module.exports = { runVerificationSuite };
