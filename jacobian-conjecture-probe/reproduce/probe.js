// 雅可比猜想探针 —— 参数化复现脚本
//
// 走一个本地代理（真 key 由代理注入；客户端只填占位 key）。
// 把 BROKER 指向你自己的 OpenAI 兼容端点即可。
// 用法：
//   node probe.js                # 全部模型 × 三变体
//   node probe.js --only grok    # 只跑某一家
//
// 环境变量：
//   BROKER  默认 http://127.0.0.1:8080
//   MAXTOK  默认 12000

const fs = require('fs');
const path = require('path');

const BASE = process.env.BROKER || 'http://127.0.0.1:8080';
const MAXTOK = Number(process.env.MAXTOK || 12000);
const OUT = process.env.OUT || path.join(__dirname, '..', 'raw', 'run');
fs.mkdirSync(OUT, { recursive: true });

// 换模型只改这里。API ID 规律见仓库根 README。
const models = {
  glm:    'or/z-ai/glm-5.3@zai',
  kimi:   'or/moonshotai/kimi-k2.6',
  ds:     'deepseek-flash',
  dspro:  'deepseek-v4-pro',
  gpt:    'or/openai/gpt-6-luna',
  gemini: 'or/google/gemini-3.5-flash',
  grok:   'or/x-ai/grok-4.6',
  claude: 'or/anthropic/claude-opus-4.6',
};

const only = (process.argv.find((a) => a.startsWith('--only=')) || process.argv[process.argv.indexOf('--only') + 1]) || null;
const prompts = JSON.parse(fs.readFileSync(path.join(__dirname, 'prompt-variants.json'), 'utf8'));

async function ask(name, model, variant, text) {
  const body = { model, messages: [{ role: 'user', content: text }], max_tokens: MAXTOK };
  const t0 = Date.now();
  try {
    const r = await fetch(`${BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer local-proxy' },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    const ch = j.choices?.[0]?.message || {};
    const rec = {
      name, variant, requested_model: model, http: r.status, ms: Date.now() - t0,
      served_model: j.model, provider: j.provider,
      reasoning: ch.reasoning || ch.reasoning_content || null,
      content: ch.content,
      finish: j.choices?.[0]?.finish_reason,
      usage: j.usage, error: j.error || null,
    };
    fs.writeFileSync(path.join(OUT, `${name}_${variant}.json`), JSON.stringify(rec, null, 2));
    console.log(`[done] ${name.padEnd(6)} ${variant} http=${r.status} ${(rec.ms / 1000).toFixed(0)}s rLen=${rec.reasoning ? rec.reasoning.length : 0} cLen=${(rec.content || '').length} finish=${rec.finish}`);
    return rec;
  } catch (e) {
    console.log(`[ERR ] ${name.padEnd(6)} ${variant} ${e.message}`);
    return { name, variant, model, error: e.message };
  }
}

(async () => {
  const tasks = [];
  for (const [name, model] of Object.entries(models)) {
    if (only && name !== only) continue;
    for (const [variant, text] of Object.entries(prompts)) tasks.push([name, model, variant, text]);
  }
  let i = 0;
  async function worker() { while (i < tasks.length) await ask(...tasks[i++]); }
  await Promise.all(Array.from({ length: 3 }, worker));
  console.log('ALL DONE -> ' + OUT);
})();
