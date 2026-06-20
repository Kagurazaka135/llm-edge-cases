# DeepSeek V4 Pro vs Flash: Pricing and Real-World Comparison

Date: 2026-06-21

---

## 1. Official Pricing (After May 22, 2026 Permanent Price Cut)

```
              Cache Miss    Cache Hit      Output       Hit Rate    Miss/Hit Ratio
V4-Pro        ¥3            ¥0.025         ¥6           95-96%      120x
V4-Flash      ¥1            ¥0.02          ¥2           91%         50x

Unit: CNY per million tokens (api.deepseek.com)
```

Pro's cache miss price is 3x Flash, but hit rate is 4-5 percentage points higher.
Cache hit prices are nearly identical (¥0.025 vs ¥0.02). The real gap is in miss price (¥3 vs ¥1).

---

## 2. Cache Hit Rate (Measured)

Optimized:
- Pro: ~95-96% (highest reported: 99.41%)
- Flash: ~91%

Unoptimized / tool search interference:
- Flash dropped from ~98% to ~81% (measured after qwen-code v0.15.10 introduced ToolSearch)

When Flash drops to 81% hit rate:
- Daily cost: $1.05 → $3.30 (+214%)
- Cache miss tokens: 3M/day → 12.9M/day (+330%)

Three causes of cache invalidation:
1. Dynamic System Prompt (embedded timestamps/user IDs → prefix changes every request)
2. Unstable tool definition ordering (MCP serialization non-determinism)
3. Message history modification (agent retroactively edits earlier records → breaks prefix consistency)

---

## 3. Hallucination Rate Comparison

```
                              Pro         Flash
SimpleQA factual accuracy     57.9        34.1        (23.8 point gap)
External knowledge halluc.    ~3-4%       ~6.5%       (2.5x)
Unknown question fabrication  94%         96%          (both nearly always fabricate — RAG required)
```

---

## 4. Thinking Mode: Impact on Output Tokens and Cost (Measured)

Method: Same question tested across Pro/Flash x thinking enabled/disabled = 4 configurations.
Cost calculated on output tokens only (input ~60-90 tokens, negligible cost).
Pro output: ¥6/M. Flash output: ¥2/M.

### Test Questions

**Q0: Pirate Game Theory**
> 5 pirates split 100 gold coins. They propose in order from highest to lowest rank. A proposal passes if at least half (including the proposer) agree. Otherwise the proposer is thrown overboard and the next pirate proposes. All pirates are perfectly rational. Preferences: survival > more gold > fewer deaths. What should Pirate #1 propose?

**Q1: Three Gods Problem (Boolos simplified)**
> Three gods: Truth, False, Random. You may ask three yes/no questions, each to one god only. Design a strategy to identify all three gods through these three questions.

**Q2: Counter-Intuitive Probability Trap**
> Problem 1: I flip three coins and tell you "at least two are heads." What's the probability all three are heads?
> Problem 2: I flip three coins and tell you "the first and second are heads." What's the probability all three are heads?
> Calculate both answers separately — note the conditions are different.

**Q3: Self-Referential Liar Paradox**
> 10 people each make a statement. Person 1: "Exactly 1 of us is a liar." Person 2: "Exactly 2 of us are liars." ... Person 10: "Exactly 10 of us are liars." Each person either always tells the truth or always lies. It's not guaranteed that both truth-tellers and liars exist (could be all liars or all truth-tellers). How many liars are there?

**Q4: Candy Game Theory (original, no searchable answer)**
> Three kids A, B, C split 20 candies. Rules: A proposes first, then B votes. If B agrees, C automatically complies. If B disagrees, B proposes and C votes. If C agrees, B's proposal stands. If C disagrees, C proposes but can't vote for themselves — teacher D randomly accepts or rejects with 50/50 probability. If D rejects, nobody gets candy. Everyone knows all rules. Preferences: more candy > not getting scolded (survival) > fewer deaths. What is A's optimal proposal?

---

**Q1: Three Gods Problem (nested logic, largest gap)**

```
Pro+thinking:    9,320 tokens × ¥6/M = ¥0.0559
Pro-thinking:    1,106 tokens × ¥6/M = ¥0.0066
Flash+thinking: 28,137 tokens × ¥2/M = ¥0.0563    ← MORE expensive than Pro+thinking!
Flash-thinking:  1,598 tokens × ¥2/M = ¥0.0032
```

Flash is 3x cheaper per token, but uses 3.2x more reasoning tokens, completely negating the price advantage. With thinking ON, Flash costs the same as Pro but produces lower quality answers.

**Q4: Candy Game Theory (original problem, highest token consumption)**

```
Pro+thinking:   24,026 tokens × ¥6/M = ¥0.1442
Pro-thinking:      971 tokens × ¥6/M = ¥0.0058
Flash+thinking: 18,981 tokens × ¥2/M = ¥0.0380
Flash-thinking:  1,118 tokens × ¥2/M = ¥0.0022
```

Flash+thinking costs less here (¥0.038 vs ¥0.144), but Flash+thinking got the WRONG answer (A=20,B=0,C=0). Pro+thinking got it right (A=10,B=10,C=0). Spending less for a wrong answer isn't "saving" — it's waste.

**Q0: Pirate Game Theory**

```
Pro+thinking:    5,925 tokens × ¥6/M = ¥0.0356
Pro-thinking:      794 tokens × ¥6/M = ¥0.0048
Flash+thinking:  9,324 tokens × ¥2/M = ¥0.0186
Flash-thinking:  1,346 tokens × ¥2/M = ¥0.0027
```

**Q2: Probability Trap (easy, all correct)**

```
Pro+thinking:   ¥0.0039    Pro-thinking:   ¥0.0023
Flash+thinking: ¥0.0011    Flash-thinking: ¥0.0006
```

For simple problems, Flash dominates: cheapest, same correct answer.

**Q3: Liar Paradox**

```
Pro+thinking:   1,789 tokens × ¥6/M = ¥0.0107
Pro-thinking:   1,122 tokens × ¥6/M = ¥0.0067    ← WRONG answer
Flash+thinking: 1,597 tokens × ¥2/M = ¥0.0032
Flash-thinking: 1,003 tokens × ¥2/M = ¥0.0020
```

Pro without thinking gave the wrong answer (said "1-9 all valid"). Flash got it right in both modes.

**Thinking Mode Cost Patterns:**

1. Thinking ON vs OFF: output tokens inflate 7-25x, cost inflates proportionally
2. Flash reasoning tokens are 1.5-3.2x Pro's when thinking is ON
   → 3x cheaper unit price × 1.5-3.2x more tokens = actual cost breaks even or worse
3. Flash's "3x cheaper" only holds with thinking OFF
4. With thinking ON: Pro costs the same or more, but answer quality is consistently higher

---

## 5. Key Conclusions

1. Flash appears 3x cheaper, but two factors eat the gap:
   a. Lower hit rate (91% vs 96%) → miss price erosion
   b. Reasoning token inflation with thinking ON (1.5-3.2x) → unit price advantage negated
   Conclusion: Flash is truly cheaper only when thinking is OFF + high cache hit rate.

2. Flash hallucination rate is 2.5x Pro's.
   SimpleQA gap of 23.8 points. Flash is essentially unusable for factual tasks.

3. Reasoning cores are likely shared (R1 heritage), but Pro has far denser knowledge and factual anchoring. With thinking OFF both degrade equally; with thinking ON, Pro's denser knowledge yields more reliable results.

4. Flash+thinking is a cost-performance trap:
   Produces massive reasoning tokens (up to 27,670) but lower reasoning quality than Pro (logic flaws on Three Gods, wrong answer on game theory). Paying roughly the same as Pro for worse answers is the worst option.

5. Optimal configuration by use case:
   - Simple tasks (translation/formatting/basic Q&A): Flash thinking OFF (cheapest, quality sufficient)
   - Medium reasoning (conditional probability/basic logic): Flash thinking OFF or ON
   - Hard reasoning (game theory/nested logic/original problems): Pro thinking ON (only consistently correct option)
   - Factual queries: Pro (2.5x lower hallucination rate)
   - Worst choice: Flash thinking ON for complex reasoning (expensive AND inaccurate)

---

## 6. Optimization Recommendations

1. Lock System Prompt — separate static role definitions from dynamic variables
2. Deterministic tool ordering — ensure serialization consistency
3. Append-only history — never modify multi-turn conversation history
4. Enable cache observability — monitor x-ds-cache-status response header
5. Hybrid routing — simple tasks on Flash thinking OFF, complex reasoning on Pro thinking ON
6. Avoid Flash+thinking for complex reasoning — costs approach Pro but quality is worse
7. Use thinking OFF for tasks that don't need deep reasoning — saves 7-25x tokens but loses nuance

---
---

# DeepSeek V4 Pro vs Flash 价格与实测对比（中文版）

整理日期：2026-06-21

---

## 一、官方定价（2026年5月22日永久降价后）

```
            缓存未命中    缓存命中       输出        命中率     miss/hit 倍率
V4-Pro      ¥3            ¥0.025        ¥6          95-96%     120 倍
V4-Flash    ¥1            ¥0.02         ¥2          91%        50 倍
```

单位：元/百万 token（api.deepseek.com 人民币价格）

Pro 未命中比 Flash 贵 3 倍，但命中率高 4-5 个百分点。
命中价差不多（¥0.025 vs ¥0.02），miss 价差距巨大（¥3 vs ¥1）。

---

## 二、缓存命中率实测

正常优化后：
- Pro ~95-96%（最高有 99.41% 的报告）
- Flash ~91%

未优化/工具搜索干扰后：
- Flash 从 ~98% 暴跌至 ~81%（qwen-code v0.15.10 引入 ToolSearch 后实测）

Flash 掉到 81% 命中时：
- 日花费 $1.05 → $3.30（+214%）
- 未命中 token 300万/天 → 1290万/天（+330%）

缓存失效三大原因：
1. 动态 System Prompt（嵌时间/用户ID → 前缀每次不同）
2. 工具定义顺序变化（MCP 序列化不稳定）
3. 消息历史被修改（Agent 回溯编辑早期记录 → 破坏前缀一致性）

---

## 三、幻觉率对比

```
                          Pro         Flash
SimpleQA 事实准确度       57.9        34.1        （差 23.8 分）
外部知识幻觉率            ~3-4%       ~6.5%       （2.5 倍）
未知问题瞎编率            94%         96%          （几乎全瞎编 — 需 RAG 兜底）
```

---

## 四、思考模式对输出token和费用的影响（实测）

测试方法：同一道题分别用 Pro/Flash × 开思考/关思考 四种组合调用 API
定价按输出计算（输入均为 60-90 tokens，费用可忽略）
Pro 输出 ¥6/M，Flash 输出 ¥2/M

### 测试题目

**题0：海盗分金币博弈**
> 有5个海盗分100枚金币，按照等级从高到低依次提出方案。如果方案获得至少一半海盗同意（包括提出者），则通过。否则提出者被扔进大海，下一个海盗继续。假设每个海盗都是完美理性的，且优先保命>多拿金币>少死人。1号海盗应该怎么分配？请详细推理。

**题1：三神问题（Boolos精简版）**
> 三个神：真话神、假话神、随机神。你可以问三个是/否问题，每个问题只能问一个神。请设计一个策略，通过这三个问题确定每个神的身份。请详细推理每一步。

**题2：反直觉概率陷阱**
> 两个概率问题，请分别作答：问题一：我抛三枚硬币，告诉你至少有两枚是正面。问三枚都是正面的概率是多少？问题二：我抛三枚硬币，告诉你第一枚和第二枚是正面。问三枚都是正面的概率是多少？请分别计算两个问题的答案，注意它们的条件不同。

**题3：自指悖论变体**
> 10个人，每人说一句话。1号说：我们中间恰好有1个撒谎者。2号说：我们中间恰好有2个撒谎者。以此类推，10号说：我们中间恰好有10个撒谎者。每个人要么永远说真话要么永远撒谎，但不保证说真话的人和撒谎的人同时存在（可能全是撒谎者或全是说真话的人）。问有多少个撒谎者？请详细推理，特别注意检查是否存在自相矛盾的情况。

**题4：糖果分配博弈（原创变体，搜不到答案）**
> 三个小孩A、B、C分20颗糖。规则：A先提案（比如我8你6他6），然后B投票。如果B同意，C自动服从，按提案分。如果B不同意，就轮到B提案，C投票。如果C同意就按B的提案分，不同意就轮到C提案但C不能投自己的票——D（老师）会随机同意或拒绝，概率各50%。如果D拒绝，所有人都不拿糖。每个人都知道全部规则，偏好：多拿糖>不被老师骂（活下去）>少死人。A的最优提案是什么？请用逆向归纳法详细推理。

---

**题1 三神问题（嵌套逻辑，差距最大）**

```
Pro+思考:    9,320 tokens × ¥6/M = ¥0.0559
Pro-思考:    1,106 tokens × ¥6/M = ¥0.0066
Flash+思考: 28,137 tokens × ¥2/M = ¥0.0563    ← 比Pro+思考还贵
Flash-思考:  1,598 tokens × ¥2/M = ¥0.0032
```

Flash 单价便宜 3 倍，但 reasoning token 多了 3.2 倍，完全抵消价格优势。
开思考时 Flash 实际花费 = Pro，但答案质量不如 Pro。

**题4 糖果博弈（原创题，token消耗最猛）**

```
Pro+思考:   24,026 tokens × ¥6/M = ¥0.1442
Pro-思考:      971 tokens × ¥6/M = ¥0.0058
Flash+思考: 18,981 tokens × ¥2/M = ¥0.0380
Flash-思考:  1,118 tokens × ¥2/M = ¥0.0022
```

这道题 Flash+思考反而比 Pro+思考 省（¥0.038 vs ¥0.144），
但 Flash+思考的答案是错的（A=20,B=0,C=0），Pro+思考答对了（A=10,B=10,C=0）。
花更少钱拿到错误答案，不是"省"，是"浪费"。

**题0 海盗博弈**

```
Pro+思考:    5,925 tokens × ¥6/M = ¥0.0356
Pro-思考:      794 tokens × ¥6/M = ¥0.0048
Flash+思考:  9,324 tokens × ¥2/M = ¥0.0186
Flash-思考:  1,346 tokens × ¥2/M = ¥0.0027
```

**题2 概率陷阱（简单题，全部答对）**

```
Pro+思考:   ¥0.0039    Pro-思考:   ¥0.0023
Flash+思考: ¥0.0011    Flash-思考: ¥0.0006
```

简单题 Flash 全面碾压：最便宜、答案一样对。

**题3 撒谎者悖论**

```
Pro+思考:   1,789 tokens × ¥6/M = ¥0.0107
Pro-思考:   1,122 tokens × ¥6/M = ¥0.0067    ← 答错了
Flash+思考: 1,597 tokens × ¥2/M = ¥0.0032
Flash-思考: 1,003 tokens × ¥2/M = ¥0.0020
```

Pro关思考翻车（答1-9都行），Flash两种模式都答对了。

**思考模式费用规律：**

1. 开思考 vs 关思考：输出 token 膨胀 7-25 倍，费用同比膨胀
2. Flash 开思考时 reasoning token 是 Pro 的 1.5-3.2 倍
   单价便宜 3 倍 × token 多 1.5-3.2 倍 = 实际费用持平甚至更贵
3. Flash "便宜 3 倍"只在关思考时成立
4. 开思考时：Pro 更贵或持平，但答案质量稳定高于 Flash

---

## 五、核心结论

1. Flash 表面便宜 3 倍，但两个因素把价差吃回去了：
   a. 低命中率（91% vs 96%）→ miss 价翻倍蚕食
   b. 开思考时 reasoning token 膨胀（1.5-3.2 倍）→ 单价优势被抵消
   结论：Flash 真正便宜的场景 = 关思考 + 高缓存命中率。其他场景跟 Pro 差不多。

2. Flash 幻觉是 Pro 的 2.5 倍。
   SimpleQA 差 23.8 分，事实类任务 Flash 基本不可用。

3. 推理内核可能同源（R1 遗产），但知识库密度和事实锚点 Pro 强太多。
   关思考后两者等同（都退化到 V3 路线的记忆检索），
   但开思考时 Pro 更高的知识密度带来更可靠的结果。

4. Flash 开思考的性价比陷阱：
   Flash 开思考会产生大量 reasoning token（最高 27670），
   但推理质量不如 Pro（三神题逻辑瑕疵、博弈题答案错误）。
   花了跟 Pro 差不多的钱，拿到更差的答案——这是最差的选择。

5. 各场景最优选择：
   - 简单任务（翻译/格式化/简单问答）：Flash 关思考（最便宜，质量够）
   - 中等推理（条件概率/基础逻辑）：Flash 关思考或 Flash 开思考
   - 高难度推理（博弈/嵌套逻辑/原创题）：Pro 开思考（唯一稳定正确的选择）
   - 事实查询：Pro（幻觉率低 2.5 倍）
   - 最差选择：Flash 开思考做复杂推理（贵且不准）

---

## 六、优化建议

1. 固化 System Prompt — 静态角色定义与动态变量分离
2. 工具定义做确定性排序 — 保证每次序列化一致
3. 只追加不修改 — 多轮对话历史不可变
4. 开缓存可观测性 — 监控 x-ds-cache-status 响应头
5. 混合路由 — 简单任务走 Flash 关思考，复杂推理切 Pro 开思考
6. 避免 Flash+思考做复杂推理 — 费用接近 Pro 但质量不如，性价比最差
7. 关思考用于不需要深度推理的场景 — token 省 7-25 倍，但会丢细节
