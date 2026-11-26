// KIKI Bot - AI Code Inspector & Fix Generator for Maintenance Portal
// Scans relevant bot files & recent errors, identifies root cause, and generates policy-checked code updates.

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const DevPolicy = require('./devPolicy.js');
const DevAccess = require('./devAccess.js');
const RailwayIntegration = require('./railwayIntegration.js');

function listEditableFiles(maxFiles = 400) {
  const results = [];
  function walk(sub) {
    const full = path.join(DevPolicy.REPO_ROOT, sub);
    if (!fs.existsSync(full)) return;
    for (const ent of fs.readdirSync(full, { withFileTypes: true })) {
      if (results.length >= maxFiles) return;
      const rel = `${sub}/${ent.name}`.replace(/\\/g, '/');
      if (ent.isDirectory()) {
        if (rel === 'commands/antinuke' || rel === 'commands/nuke') continue;
        walk(rel);
      } else if (ent.isFile() && DevPolicy.isEditablePath(rel)) {
        results.push(rel);
      }
    }
  }
  walk('commands');
  walk('events');
  walk('utils');
  return results.sort();
}

function findRelevantFiles(query, client = null, limit = 8) {
  const qLower = String(query || '').toLowerCase();
  const words = qLower
    .replace(/^[&/!]/, '')
    .split(/[^a-z0-9_-]+/)
    .filter(w => w.length >= 2);

  const candidates = new Map();
  function scoreFile(rel, score, reason) {
    if (!DevPolicy.isReadablePath(rel)) return;
    const prev = candidates.get(rel);
    if (!prev || prev.score < score) candidates.set(rel, { path: rel, score, reason });
  }

  // 1. Check command aliases directly from live bot client
  if (client?.prefixCommands) {
    for (const w of words) {
      const cmd = client.prefixCommands.get(w);
      if (cmd) {
        const nameGuess = cmd.data?.name || cmd.name;
        const cat = cmd.category || 'utility';
        const guess = `commands/${cat}/${nameGuess}.js`;
        if (fs.existsSync(path.join(DevPolicy.REPO_ROOT, guess))) {
          scoreFile(guess, 100, `Exact command/alias match for '${w}'`);
        }
      }
    }
  }

  // 2. Score by filename & lightweight content search across allowed files
  const all = listEditableFiles(1300);
  for (const rel of all) {
    let score = 0;
    const lowerRel = rel.toLowerCase();
    for (const w of words) {
      if (lowerRel.includes(w)) score += 15;
    }
    if (score === 0 && words.length > 0 && !lowerRel.includes('util-tool-') && !lowerRel.includes('gothic-fun-')) {
      try {
        const content = fs.readFileSync(path.join(DevPolicy.REPO_ROOT, rel), 'utf8').toLowerCase();
        for (const w of words) {
          if (w.length >= 4 && content.includes(w)) score += 6;
        }
      } catch {}
    }
    if (score > 0) scoreFile(rel, score, 'Keyword / code reference match');
  }

  return Array.from(candidates.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function getAiProviderConfig() {
  const gemini = DevAccess.getSecretFromEnvOrVault('GEMINI_API_KEY', 'aiApiKeyEnc');
  const openai = process.env.OPENAI_API_KEY;
  if (gemini && !gemini.startsWith('sk-')) return { provider: 'gemini', key: gemini };
  if (openai || (gemini && gemini.startsWith('sk-'))) return { provider: 'openai', key: openai || gemini };
  return null;
}

async function analyzeAndGenerateFix({ prompt, targetPaths = [], client = null }) {
  const recentErrors = RailwayIntegration.getRuntimeErrors(8);
  let matched = findRelevantFiles(prompt, client, 6);

  // Add explicitly opened/selected files first
  for (const p of targetPaths || []) {
    const norm = DevPolicy.normalizeRelPath(p);
    if (norm && DevPolicy.isEditablePath(norm) && !matched.some(m => m.path === norm)) {
      matched.unshift({ path: norm, score: 200, reason: 'Selected in editor' });
    }
  }
  matched = matched.slice(0, 5);

  const fileContexts = matched.map(m => {
    const full = path.join(DevPolicy.REPO_ROOT, m.path);
    const content = fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : '';
    return { path: m.path, reason: m.reason, content: content.slice(0, 14000) };
  });

  const aiCfg = getAiProviderConfig();
  if (!aiCfg) {
    return {
      aiPowered: false,
      rootCause: matched.length
        ? `Matched ${matched.length} file(s) related to "${prompt.slice(0, 120)}". Open them in the editor below to apply edits, run sandbox tests, and submit a PR (or connect GEMINI_API_KEY / OPENAI_API_KEY in Owner Settings for automatic AI code generation).`
        : 'No direct filename match found. Pick a file from the left tree or connect GEMINI_API_KEY / OPENAI_API_KEY.',
      matchedFiles: fileContexts.map(f => ({ path: f.path, reason: f.reason })),
      recentErrors,
      proposedEdits: []
    };
  }

  const systemPrompt =
    'You are the KIKI Discord Bot AI maintenance engineer. ' +
    'Given the developer issue/command request, recent runtime errors, and allowed source files, identify the root cause and return strict JSON ONLY with schema: ' +
    '{"rootCause":"short explanation","errorFixed":"concise 1-line summary","proposedEdits":[{"path":"relative/path.js","summary":"what changed","content":"FULL UPDATED FILE CONTENT"}]}. ' +
    'Only modify files inside commands/, events/, or allowed utils/. NEVER include .env, tokens, child_process, fs.rm/unlink, or owner permission modifications.';

  const userPrompt = JSON.stringify({
    request: prompt,
    recentErrors,
    files: fileContexts.map(f => ({ path: f.path, content: f.content }))
  });

  try {
    let rawJsonText = '';
    if (aiCfg.provider === 'gemini') {
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${aiCfg.key}`;
      const resp = await axios.post(url, {
        contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        generationConfig: { responseMimeType: 'application/json' }
      }, { timeout: 30000 });
      rawJsonText = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    } else {
      const resp = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      }, {
        headers: { Authorization: `Bearer ${aiCfg.key}`, 'Content-Type': 'application/json' },
        timeout: 30000
      });
      rawJsonText = resp.data?.choices?.[0]?.message?.content || '{}';
    }

    const parsed = JSON.parse(rawJsonText);
    const safeEdits = [];
    const blocked = [];

    for (const ed of (parsed.proposedEdits || [])) {
      const scan = DevPolicy.scanCodeSafety(ed.path, ed.content);
      if (scan.allowed) {
        safeEdits.push({ path: scan.normalizedPath, summary: ed.summary || 'AI generated fix', content: ed.content });
      } else {
        blocked.push({ path: ed.path, reason: scan.reason });
      }
    }

    return {
      aiPowered: true,
      provider: aiCfg.provider,
      rootCause: parsed.rootCause || 'Diagnosis complete.',
      errorFixed: parsed.errorFixed || prompt.slice(0, 120),
      matchedFiles: fileContexts.map(f => ({ path: f.path, reason: f.reason })),
      recentErrors,
      proposedEdits: safeEdits,
      blockedEdits: blocked
    };
  } catch (err) {
    return {
      aiPowered: false,
      error: `AI provider request failed (${err.response?.data?.error?.message || err.message}). Falling back to local file match.`,
      rootCause: matched.length ? `Matched ${matched.length} file(s) locally for manual review.` : 'Check recent error log below.',
      matchedFiles: fileContexts.map(f => ({ path: f.path, reason: f.reason })),
      recentErrors,
      proposedEdits: []
    };
  }
}

module.exports = {
  listEditableFiles,
  findRelevantFiles,
  getAiProviderConfig,
  analyzeAndGenerateFix
};
