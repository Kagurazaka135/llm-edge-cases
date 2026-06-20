# DeepSeek V4 Thinking Mode: On vs Off Comparison

Test Date: 2026-06-21  
Test Question: Pirate Gold Coin Game Theory (5 pirates, 100 coins, preference: survival > more gold > fewer deaths)

---

## 1. How to Control Thinking Mode

**Enable (default):**
```python
extra_body={"thinking": {"type": "enabled"}}
reasoning_effort="high"  # or "max"
```

**Disable:**
```python
extra_body={"thinking": {"type": "disabled"}}
# reasoning_effort not needed
```

Note: In thinking mode, `temperature`, `top_p`, `presence_penalty`, `frequency_penalty` are all ignored. Setting them won't cause errors but won't take effect either.

---

## 2. V4-pro Comparison

**Thinking ON:**
- Answer: Pirate #1 takes all 100 coins, others get 0
- Reasoning: Noticed the problem says "prefer fewer deaths" (not "bloodthirsty"). When gold is equal, pirates vote YES to keep the proposer alive. No bribery needed.
- reasoning_tokens: 5,406
- completion_tokens: 5,925
- total_tokens: 6,015

**Thinking OFF:**
- Answer: #1: 98, #2: 0, #3: 1, #4: 0, #5: 1 (classic textbook answer)
- Reasoning: Applied the standard game theory model without noticing the "fewer deaths" vs "bloodthirsty" wording difference
- reasoning_tokens: 0
- completion_tokens: 794
- total_tokens: 884

---

## 3. V4-flash Comparison

**Thinking ON:**
- Answer: Pirate #1 takes all 100 coins, others get 0 (same as pro)
- Reasoning: Also caught the "fewer deaths" nuance
- reasoning_tokens: 8,869
- completion_tokens: 9,324
- total_tokens: 9,414

**Thinking OFF:**
- Answer: #1: 98, #2: 0, #3: 1, #4: 0, #5: 1 (same as pro with thinking off)
- reasoning_tokens: 0
- completion_tokens: 1,346
- total_tokens: 1,436

---

## 4. Key Findings

**1. Can disabling thinking mode stop verbose chain-of-thought output?**

Yes. Setting `{"thinking": {"type": "disabled"}}` completely removes reasoning output. Token consumption drops to ~1/7.

**2. The switch affects answer quality, not just token count**

- Thinking ON: Models deeply analyze problem wording, catch subtle distinctions ("fewer deaths" vs "bloodthirsty" in this case)
- Thinking OFF: Models default to known templates, skip nuances
- Trade-off: OFF = fast and cheap but loses detail; ON = slow and expensive but more accurate

**3. Pro vs Flash**

Both reach the same conclusions. However, Flash uses ~60% more reasoning tokens than Pro (8,869 vs 5,406). Pro is more efficient - thinks less but equally accurate. With thinking off, both give identical answers; Flash output is slightly longer (1,346 vs 794 tokens).

**4. Practical Usage Recommendation**

- Simple tasks (translation, formatting, basic Q&A): Disable thinking, save cost
- Complex tasks (logic, debugging, deep analysis): Enable thinking, quality matters
- Daily coding (opencode/Claude Code): Keep default (enabled), effort auto-scales to max

---

## 5. Code Templates

```python
from openai import OpenAI

client = OpenAI(
    api_key="your-api-key",
    base_url="https://api.deepseek.com"
)

# Thinking ON
response = client.chat.completions.create(
    model="deepseek-v4-pro",  # or deepseek-v4-flash
    messages=[...],
    stream=False,
    reasoning_effort="high",
    extra_body={"thinking": {"type": "enabled"}}
)

# Thinking OFF
response = client.chat.completions.create(
    model="deepseek-v4-pro",  # or deepseek-v4-flash
    messages=[...],
    stream=False,
    extra_body={"thinking": {"type": "disabled"}}
)

# Read chain-of-thought (when thinking is ON)
reasoning = response.choices[0].message.reasoning_content
content = response.choices[0].message.content
```

---
---

# DeepSeek V4 思考模式开关对比测试（中文版）

测试日期：2026-06-21
测试问题：海盗分金币博弈（5人分100枚，偏好：保命>多拿金币>少死人）

---

## 一、怎么控制思考模式

开启（默认）：
```python
extra_body={"thinking": {"type": "enabled"}}
reasoning_effort="high"  # 或 "max"
```

关闭：
```python
extra_body={"thinking": {"type": "disabled"}}
# 不需要 reasoning_effort 参数
```

注意：思考模式下 temperature、top_p、presence_penalty、frequency_penalty 全部无效，设了不报错但也不生效。

---

## 二、V4-pro 对比

**开思考：**
- 答案：1号拿100枚，其余全0
- 推理：注意到题目写的是"少死人"而非"嗜血"，推导出金币相同时海盗会投赞成票保提案者活命，因此不用分钱也能获得多数票
- reasoning_tokens：5406
- completion_tokens：5925
- total_tokens：6015

**关思考：**
- 答案：1号98, 2号0, 3号1, 4号0, 5号1（经典教科书答案）
- 推理：直接套用经典博弈论模型，未注意"少死人"与"嗜血"的措辞差异
- reasoning_tokens：0
- completion_tokens：794
- total_tokens：884

---

## 三、V4-flash 对比

**开思考：**
- 答案：1号拿100枚，其余全0（与pro一致）
- 推理：同样捕捉到了"少死人"的细节
- reasoning_tokens：8869
- completion_tokens：9324
- total_tokens：9414

**关思考：**
- 答案：1号98, 2号0, 3号1, 4号0, 5号1（与pro关思考一致）
- reasoning_tokens：0
- completion_tokens：1346
- total_tokens：1436

---

## 四、核心结论

1. **关思考能不能让模型不碎碎念？**
   能。设置 `{"thinking": {"type": "disabled"}}` 后完全没有 reasoning 输出，token 消耗降到开思考的 1/7 左右。

2. **开关影响的不只是 token 数量，还有答案质量**
   开思考的模型会深入分析题目措辞，捕捉细节差异（本例中"少死人"vs"嗜血"）。
   关思考的模型倾向于直接套用已知模板，跳过细节。
   这意味着：关思考=快且省，但会丢细节；开思考=慢且贵，但更准。

3. **Pro vs Flash**
   结论一致，但 flash 的思考量比 pro 多约60%（8869 vs 5406 tokens）。
   Pro 更高效——想得少但同样准。
   关思考状态下两者答案也一致，flash 输出稍长（1346 vs 794）。

4. **实际使用建议**
   - 简单任务（翻译、格式化、简单问答）：关思考，省钱省时间
   - 复杂任务（逻辑推理、代码调试、深度分析）：开思考，质量有保障
   - 日常编码（opencode/Claude Code场景）：保持默认开启，effort 会自动调为 max

---

## 五、调用代码模板

```python
from openai import OpenAI

client = OpenAI(
    api_key="your-api-key",
    base_url="https://api.deepseek.com"
)

# 开思考
response = client.chat.completions.create(
    model="deepseek-v4-pro",  # 或 deepseek-v4-flash
    messages=[...],
    stream=False,
    reasoning_effort="high",
    extra_body={"thinking": {"type": "enabled"}}
)

# 关思考
response = client.chat.completions.create(
    model="deepseek-v4-pro",  # 或 deepseek-v4-flash
    messages=[...],
    stream=False,
    extra_body={"thinking": {"type": "disabled"}}
)

# 读取思维链（开思考时）
reasoning = response.choices[0].message.reasoning_content
content = response.choices[0].message.content
```
