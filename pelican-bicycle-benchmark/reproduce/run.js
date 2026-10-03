// 鹈鹕骑车横评 —— 参数化复现脚本
//
// 走本地凭证代理（真 key 由代理注入；客户端只填假 key local-broker）。
// 用法：
//   node run.js                  # 全部模型 × 原始题
//   node run.js --openbook       # 全部模型 × 开卷详规
//   node run.js --only=V4.1-Flash
//
// 环境变量：
//   BROKER  默认 http://127.0.0.1:9999
//   MAXTOK  默认 64000

const fs = require('fs');
const path = require('path');

const BASE = process.env.BROKER || 'http://127.0.0.1:9999';
const MAXTOK = Number(process.env.MAXTOK || 64000);
const RAW = path.join(__dirname, '..', 'raw');
const HTML = path.join(__dirname, '..', 'html');
fs.mkdirSync(RAW, { recursive: true });
fs.mkdirSync(HTML, { recursive: true });

// 换模型只改这里。API ID 规律见仓库 README。
const models = {
  'V3':            'or/deepseek/deepseek-chat',
  'R1':            'or/deepseek/deepseek-r1',
  'V3-0324':       'or/deepseek/deepseek-chat-v3-0324',
  'R1-0528':       'or/deepseek/deepseek-r1-0528',
  'V3.1':          'or/deepseek/deepseek-chat-v3.1',
  'V3.1-Terminus': 'or/deepseek/deepseek-v3.1-terminus',
  'V3.2-Exp':      'or/deepseek/deepseek-v3.2-exp',
  'V3.2':          'or/deepseek/deepseek-v3.2',
  'V4-Flash':      'or/deepseek/deepseek-v4-flash',
  'V4-Pro':        'or/deepseek/deepseek-v4-pro',
  'V4.1-Flash':    'or/deepseek/deepseek-v4.1-flash',
  'GPT-6_Luna':    'or/openai/gpt-6-luna',
  'Opus_4.6':      'or/anthropic/claude-opus-4.6',
  'Opus-5.5':      'or/anthropic/claude-opus-5.5',
  'GLM-5.3':       'or/z-ai/glm-5.3@zai',
};

const openbook = process.argv.includes('--openbook');
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice('--only='.length) || null;
const promptKey = openbook ? 'openbook' : 'raw';
const text = JSON.parse(fs.readFileSync(path.join(__dirname, 'prompts.json'), 'utf8'))[promptKey];
const safe = (s) => s.replace(/[^A-Za-z0-9._-]/g, '_');

function extractHtml(s) {
  if (!s) return '';
  const m = s.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (m) return m[1].trim();
  const i = s.search(/<!DOCTYPE|<html/i);
  return i >= 0 ? s.slice(i).trim() : s.trim();
}

async function ask(name, model) {
  const body = { model, messages: [{ role: 'user', content: text }], max_tokens: MAXTOK, temperature: 0.7 };
  const t0 = Date.now();
  try {
    const r = await fetch(`${BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer local-broker' },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    const ch = j.choices?.[0] || {};
    const cont = (ch.message || {}).content || '';
    const html = extractHtml(cont);
    const pre = openbook ? 'openbook-' : '';
    fs.writeFileSync(path.join(RAW, `${pre}${safe(name)}.json`), JSON.stringify(j, null, 2));
    if (html && /<html|<!DOCTYPE|<body|<canvas|<svg|<div/i.test(html)) {
      fs.writeFileSync(path.join(HTML, `${pre}${safe(name)}.html`), html);
    }
    const pel = /鹈鹕|pelican/i.test(html);
    const hum = /骑手|人形|\bperson\b|\bhuman\b|\brider\b/i.test(html);
    console.log(`[done] ${name.padEnd(16)} http=${r.status} ${((Date.now() - t0) / 1000).toFixed(0)}s ` +
      `tok=${j.usage?.completion_tokens} finish=${ch.finish_reason} 鹈鹕=${pel} 人=${hum}`);
  } catch (e) {
    console.log(`[ERR ] ${name.padEnd(16)} ${e.message}`);
  }
}

(async () => {
  const entries = Object.entries(models).filter(([n]) => !only || n === only);
  console.log(`# 变体=${promptKey} 模型=${entries.length}\n`);
  let i = 0;
  async function worker() { while (i < entries.length) { const [n, m] = entries[i++]; await ask(n, m); } }
  await Promise.all(Array.from({ length: 3 }, worker));
  console.log('\nALL DONE -> ' + RAW + ' / ' + HTML);
})();
