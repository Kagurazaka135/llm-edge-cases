# 鹈鹕骑车横评：当"更强的模型"开始擅自改题

> 一道经典 LLM 编码题（Simon Willison 的 "pelican riding a bicycle"，HTML 动画版）横跨
> **DeepSeek 全代 + GPT / Claude / GLM**，观察两件在单模型身上看不出来的事：
> **① 谁真的照题画，谁偷偷把主体换成了更"合理"的东西；② 给了详细文字规格之后，抽象的老模型能不能补救。**

---

## 背景

题目是「用 HTML 做一个**鹈鹕在海边道路上骑自行车**的动画」——一句话，不点名、不给参考图。

这道题之所以好，是因为它同时压测三件事：

1. **指代服从（instruction following）**：主体是"鹈鹕"，不是"骑车的生物"。模型会不会嫌鹈鹕不合理、
   擅自换成"骑车人"？
2. **空间组装（composition）**：鹈鹕、自行车、海浪、公路要在同一画面里**摆对关系**（坐在座垫上、
   脚踩踏板），不是各画各的。
3. **动画连通（animation wiring）**：说"踩踏循环"，是**真把脚挂到踏板上转**，还是**脚自己在原地晃、
   车一动不动**。

DeepSeek 提供了难得的长版本阶梯（V3 → R1 → V3.1 → V3.2 → V4 → V4.1），正好做纵向对照；
再拉 GPT-6 Luna / Claude Opus 4.6、5.5 / GLM 5.3 做横向对照。

---

## 三个实验

| # | 实验 | 输入 | 目的 |
|---|------|------|------|
| A | **原始题** | 一句话（见 `prompts.md`） | 看谁咬题、谁漂移 |
| B | **开卷** | 一段**把答案写死**的详细文字规格（体型/姿态/配色/场景/动画逐条列明） | 给"抽象的老模型"补课，看能不能救 |
| C | **隔离** | V4.1 单跑：① 只给详细文字、不给图 ② 给图复现 | 分离"是文字规格救的，还是视觉救的" |

---

## 被测模型

调用一律走**本地凭证代理**（真 key 由代理注入，客户端只填假 key `local-broker`），
模型名一律 OpenRouter / DeepSeek 原生 ID。温度 0.7，`max_tokens` 逐轮按需放宽（见各 `raw/*.json`）。

| 标签 | 模型 | API ID | 家族/代次 |
|------|------|--------|----------|
| `V3` | DeepSeek V3 | `or/deepseek/deepseek-chat` | DS 老 |
| `R1` | DeepSeek R1 | `or/deepseek/deepseek-r1` | DS 老 |
| `V3-0324` | DeepSeek V3-0324 | `or/deepseek/deepseek-chat-v3-0324` | DS 老 |
| `R1-0528` | DeepSeek R1-0528 | `or/deepseek/deepseek-r1-0528` | DS 老 |
| `V3.1` | DeepSeek V3.1 | `or/deepseek/deepseek-chat-v3.1` | DS 老 |
| `V3.1-Terminus` | DeepSeek V3.1-Terminus | `or/deepseek/deepseek-v3.1-terminus` | DS 老 |
| `V3.2-Exp` | DeepSeek V3.2-Exp | `or/deepseek/deepseek-v3.2-exp` | DS 老 |
| `V3.2` | DeepSeek V3.2 | `or/deepseek/deepseek-v3.2` | DS 老 |
| `V4-Flash` | DeepSeek V4 Flash | `or/deepseek/deepseek-v4-flash` | DS 新 |
| `V4-Pro` | DeepSeek V4 Pro | `or/deepseek/deepseek-v4-pro` | DS 新·旗舰 |
| `V4.1-Flash` | DeepSeek V4.1 Flash | `or/deepseek/deepseek-v4.1-flash` | DS 新·首个带视觉 |
| `Luna` | GPT-6 Luna | `or/openai/gpt-6-luna` | OpenAI |
| `Opus4.6` | Claude Opus 4.6 | `or/anthropic/claude-opus-4.6` | Anthropic |
| `Opus5.5` | Claude Opus 5.5 | `or/anthropic/claude-opus-5.5` | Anthropic |
| `GLM5.3` | GLM 5.3（700B） | `or/z-ai/glm-5.3@zai` | 智谱 |

（`@zai` 把供给方钉死在智谱官方 Z.AI——同一个 `z-ai/glm-5.3` 背后有几十个供给方，
不钉选会乱飘。）

---

## 目录结构

```
pelican-bicycle-benchmark/
├── README.md            # 本文件：实验设计 / 模型 / 复现
├── FINDINGS.md          # 现象总结（核心结论 + 证据矩阵 + 蹬踏机制拆解）
├── prompts.md           # 原始题 + 开卷详规 原文
├── gallery.html         # 自包含动画墙（27 个输出 iframe 内联，浏览器打开即跑）
├── reproduce/           # 参数化复现脚本（走本地 broker）
│   ├── run.js
│   └── prompts.json
├── raw/                 # 33 份原始调用记录（未删改）
├── html/                # 从响应里抽出的单文件 HTML（可直接双击运行）
└── shots/               # headless chrome 截图（含曲柄区放大帧，见 FINDINGS 的蹬踏分析）
```

每份 `raw/*.json` 记录：请求模型、served 模型、HTTP 状态、耗时、`content`、`finish_reason`、`usage`。
**原始输出未删改**。`html/` 是从 `content` 里剥出代码块得到的可运行版本。

---

## 复现

```bash
# 需要本地凭证代理在 127.0.0.1:9999 运行（真 key 由代理注入，客户端只填假 key）
node reproduce/run.js            # 全部模型 × 原始题
node reproduce/run.js --openbook # 全部模型 × 开卷详规
node reproduce/run.js --only=V4.1-Flash
```

脚本不硬编码任何真 key：`baseUrl=http://127.0.0.1:9999`，`apiKey=local-broker`。

要看动图/截图：

```bash
# 单文件 HTML 直接双击即可；批量截图用 headless chrome
chrome --headless=new --disable-gpu --hide-scrollbars \
  --window-size=900,620 --virtual-time-budget=4000 \
  --screenshot=out.png html/<模型>.html
```

---

## 结论速览

1. **"漂移去画人"集中在最新旗舰。** 原始题下，**V4-Pro / V4.1-Flash / Opus 5.5** 把主体擅自换成
   "骑车人"；而**所有更老的 DS（V3→V3.2）+ V4-Flash + Opus 4.6**，以及跨家族的 **GPT-6 Luna / GLM 5.3**，
   都老老实实画鹈鹕。⇒ **capability ≠ compliance：更能干的版本，更爱自作主张改题。**
2. **V4.1-Flash 的漂移是稳定的，不是抽风**（连跑三次全是人，代码里连 "鹈鹕/pelican" 字样都没有）。
3. **开卷有效但有限。** 给详细文字规格后，纯文本老模型能"知道要画鹈鹕"（元素齐），
   但**空间组装依然摆不对**。
4. **隔离实验实锤：救 V4.1 的是文字规格，不是视觉。** 只给详细文字、**不给图**，V4.1 照样画对。
5. **"看起来在蹬" ≠ "真的在蹬"。** 原始题下多数输出是"脚在原地晃、曲柄不动"；
   真踩踏（曲柄/踏板/脚共用一个曲柄角 + 膝盖逆运动学）只在**开卷的 V4.1 / 开卷的 Luna / 原始题的 GLM 5.3** 上出现。

详细矩阵、机制拆解与逐字引文见 **[FINDINGS.md](FINDINGS.md)**。

---

## 免责声明

本仓库记录的是**观察到的行为**与**基于行为的机制假设**，不是对模型内部机制的断言。
所有输出均为真实调用所得，原始数据见 `raw/`，可运行结果见 `html/` 与 `gallery.html`。
