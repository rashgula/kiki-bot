// KIKI Bot - Local PC Auto-Sync Watcher
// Polls GitHub origin/main every 20 seconds and safely fast-forwards your local folder whenever an approved maintenance fix is merged.
// Never overwrites uncommitted local work!

const { execFileSync } = require('child_process');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const INTERVAL_MS = Number(process.env.PC_SYNC_INTERVAL_MS || 20000);

function git(args) {
  return execFileSync('git', args, { cwd: REPO_ROOT, stdio: ['ignore', 'pipe', 'pipe'] })
    .toString('utf8')
    .trim();
}

function checkAndSync() {
  try {
    git(['fetch', 'origin', 'main', '--quiet']);
    const localSha = git(['rev-parse', 'HEAD']);
    const remoteSha = git(['rev-parse', 'origin/main']);

    if (localSha === remoteSha) return;

    const dirty = git(['status', '--porcelain']);
    if (dirty) {
      console.log(`[${new Date().toLocaleTimeString()}] ⚠️ New update on GitHub (${remoteSha.slice(0, 7)}), skipped auto-pull because local files have uncommitted edits.`);
      return;
    }

    const logSummary = git(['log', '--oneline', `${localSha}..${remoteSha}`]);
    git(['pull', '--ff-only', 'origin', 'main']);
    console.log(`\n[${new Date().toLocaleTimeString()}] ✅ Synced approved maintenance update to your PC!\n${logSummary}\n`);
  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString()}] [PC-SYNC ERROR]`, err.stderr?.toString()?.trim() || err.message);
  }
}

console.log(`🔮 KIKI PC Auto-Sync Active in: ${REPO_ROOT}`);
console.log(`🔄 Checking origin/main every ${Math.round(INTERVAL_MS / 1000)}s (keeps local edits safe)...\n`);
checkAndSync();
setInterval(checkAndSync, INTERVAL_MS);
