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

function detectProviderFromKey(key) {
  const k = String(key || '').trim();
  if (!k) return null;
  if (k.startsWith('gsk_')) return { provider: 'groq', key: k };
  if (k.startsWith('sk-or-')) return { provider: 'openrouter', key: k };
  if (k.startsWith('sk-')) return { provider: 'openai', key: k };
  return { provider: 'gemini', key: k };
}

function getAiProviderConfig() {
  const vaultOrGemini = DevAccess.getSecretFromEnvOrVault('GEMINI_API_KEY', 'aiApiKeyEnc');
  if (vaultOrGemini) return detectProviderFromKey(vaultOrGemini);
  if (process.env.GROQ_API_KEY) return { provider: 'groq', key: process.env.GROQ_API_KEY.trim() };
  if (process.env.OPENROUTER_API_KEY) return { provider: 'openrouter', key: process.env.OPENROUTER_API_KEY.trim() };
  if (process.env.OPENAI_API_KEY) return { provider: 'openai', key: process.env.OPENAI_API_KEY.trim() };
  if (process.env.AI_API_KEY) return detectProviderFromKey(process.env.AI_API_KEY);
  return null;
}

function stripJsonFences(text) {
  const s = String(text || '').trim();
  const m = s.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return m ? m[1].trim() : s;
}

async function callGemini(key, promptText) {
  const primary = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const fallbacks = ['gemini-3.8-flash', 'gemini-3-flash-preview', 'gemini-3.5-flash-lite', 'gemini-2.5-flash'];
  const models = Array.from(new Set([primary, ...fallbacks].filter(Boolean)));
  let lastErr;
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
      const resp = await axios.post(url, {
        contents: [{ role: 'user', parts: [{ text: promptText }] }],
        generationConfig: { responseMimeType: 'application/json' }
      }, { timeout: 60000 });
      const parts = resp.data?.candidates?.[0]?.content?.parts || [];
      const answerPart = [...parts].reverse().find(p => !p.thought && typeof p.text === 'string') || parts[0];
      return answerPart?.text || '{}';
    } catch (err) {
      lastErr = err;
      const st = err.response?.status;
      if (st !== 404 && st !== 400) throw err;
    }
  }
  throw lastErr;
}

async function callOpenAiCompatible(provider, key, systemPrompt, userPrompt) {
  const endpoints = {
    groq: { url: 'https://api.groq.com/openai/v1/chat/completions', model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile' },
    openrouter: { url: 'https://openrouter.ai/api/v1/chat/completions', model: process.env.OPENROUTER_MODEL || 'google/gemini-3.8-flash' },
    openai: { url: 'https://api.openai.com/v1/chat/completions', model: process.env.OPENAI_MODEL || 'gpt-4o-mini' }
  };
  const cfg = endpoints[provider] || endpoints.openai;
  const resp = await axios.post(cfg.url, {
    model: cfg.model,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  }, {
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    timeout: 30000
  });
  return resp.data?.choices?.[0]?.message?.content || '{}';
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
      provider: null,
      rootCause: matched.length
        ? `Matched ${matched.length} file(s) related to "${prompt.slice(0, 120)}".`
        : `No direct filename match found for "${prompt.slice(0, 120)}".`,
      matchedFiles: fileContexts.map(f => ({ path: f.path, reason: f.reason })),
      recentErrors,
      proposedEdits: []
    };
  }

  const systemPrompt =
    'You are the KIKI Discord Bot AI maintenance engineer. ' +
    'Given the developer issue/command request, recent runtime errors, and allowed source files, identify the root cause or create the requested command and return strict JSON ONLY with schema: ' +
    '{"rootCause":"short explanation","errorFixed":"concise 1-line summary","proposedEdits":[{"path":"relative/path.js","summary":"what changed","content":"FULL UPDATED FILE CONTENT"}]}. ' +
    'For new commands inside commands/<category>/<name>.js (e.g. utility/fun/economy/social/games), export both slash (SlashCommandBuilder data + execute(interaction, client)) and prefix (name, aliases, run(message, args, client)) using KikiEmbed from "../../utils/embed.js". ' +
    'Only modify/create files inside commands/, events/, or allowed utils/. NEVER include .env, tokens, child_process, fs.rm/unlink, or owner permission modifications.';

  const userPrompt = JSON.stringify({
    request: prompt,
    recentErrors,
    files: fileContexts.map(f => ({ path: f.path, content: f.content }))
  });

  try {
    const rawJsonText = aiCfg.provider === 'gemini'
      ? await callGemini(aiCfg.key, `${systemPrompt}\n\n${userPrompt}`)
      : await callOpenAiCompatible(aiCfg.provider, aiCfg.key, systemPrompt, userPrompt);

    const parsed = JSON.parse(stripJsonFences(rawJsonText));
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
      provider: aiCfg.provider,
      error: `AI provider (${aiCfg.provider}) request failed: ${err.response?.data?.error?.message || err.message}`,
      rootCause: matched.length ? `Matched ${matched.length} file(s) locally for manual review.` : 'Check error or select a file manually.',
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
