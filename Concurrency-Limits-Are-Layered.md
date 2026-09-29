# Concurrency Limits Are Layered — Not a Model Property

People love to quote a single number: *"this model does 300 concurrent."* It is almost always a misleading number, because what was actually measured is **the first layer that broke** — and there are at least four nested layers between your code and the model. Two people can measure the "same model," get answers a hundred times apart, and both be correct.

These are informal notes, matching the tone of the rest of this repo. Every number below was measured by hand on one Windows 11 machine over a couple of days. They describe **what this layer looked like on this machine**, not a specification. Re-measure before you rely on any of it.

人们特别喜欢引用一个数字：“这个模型能跑 300 并发。” 这个数字基本都是有问题的，因为它测到的其实是**第一个崩掉的层**——而从你的代码到模型之间，至少隔着四层。两个人测“同一个模型”，结果可能差一百倍，而且都没错。

下面是随手记的观察，和这个仓库其他内容一个调性。所有数字都是在一台 Windows 11 机器上手工测的，仅供参考，别当规格书用——真要用之前自己重测一遍。

---

## Phenomena

1. **Same model, different client, different ceiling.** Across four coding harnesses — ZCode, Claude Code, Codex, dsh — measured on the same machine, the *client layer alone* gave: sub-agents capped at **2** (ZCode, hard-refused); **0 in a non-git directory but ≥10 in a git one** (Claude Code); **8 background / 10 foreground** (dsh); and **no sub-agent interface at all** (Codex, which instead accepted 80 parallel tool calls). Same models underneath. The harness *is* the ceiling — and it is a different shape in each one.

2. **Same client, different model, different ceiling.** Two providers behind the same local gateway: one showed no visible cap (300 concurrent all returned), another started returning `429` at roughly **100** in-flight. Same code path, same machine.

3. **Same setup, different run, different number.** The *same* 300-request test, run twice in a row, gave 300/300 and then 228/300. Nothing changed except that the first run left `TIME_WAIT` sockets behind. This is the single biggest source of fake "limits."

4. **Free tier ≠ paid tier.** On one gateway's free models, a 30-request burst returned **4 successes and 26 × `429`** — and *every one* of those 429s was the **upstream provider's shared pool**, not the account's own quota. Adding more API keys does not help, and the gateway says so explicitly: *capacity is governed globally.*

5. **The error code names the wrong layer.** A `429` can mean *your* account hit its per-minute cap, **or** the *upstream provider* is out of capacity. Identical status code, completely different fix. Reading only the code — and not the error body — sends you to the wrong layer.

1. **同一个模型，换个客户端，上限就变。** 在**同一台机器**上测四款编程外壳——ZCode、Claude Code、Codex、dsh，**光客户端这一层**就给出：子代理卡 **2 个**（ZCode，硬拒）；**非 git 目录 0 个、git 目录 ≥10 个**（Claude Code）；**后台 8 / 前台 10**（dsh）；还有一款**压根没有子代理接口**（Codex，但它接受 80 个并行工具调用）。底下模型差不多。**外壳本身就是那堵墙，而且每一款墙的形状都不一样。**

2. **同一个客户端，换个模型，上限又变。** 同一个本地网关后面挂了两个上游：一个看不出闸（300 并发全过），另一个在途大概到 **100** 就开始回 `429`。同一套代码，同一台机器。

3. **什么都没变，第二次跑数就变了。** 同一个 300 请求的测试，连着跑两遍：第一遍 300/300，第二遍 228/300。唯一的区别是第一遍留下了一堆 `TIME_WAIT` 套接字。这是**假“上限”最大的来源**。

4. **免费档 ≠ 付费档。** 某网关的免费模型上，炸 30 个并发，只回了 **4 个成功、26 个 `429`**——而且这 26 个**全是上游 provider 的共享池**，不是账号自己的配额。多加几个 key 也没用，网关自己就写明了：*容量是全局治理的。*

5. **错误码指错了层。** 一个 `429` 可能是**你自己的账号**撞了每分钟上限，**也可能是上游 provider 没容量了**。码一样，解法完全不同。只看码、不看错误体，就会跑去修错的那一层。

---

## The Layers

```
your orchestration
  └─ 1. client / harness        slot model, context budget, local serialization
       └─ 2. account / plan     commercial gate (per-user, per-plan)
            └─ 3. upstream model provider in-flight cap, shared pools
                 └─ 4. transport sockets, proxies, DNS, TIME_WAIT
```

Each layer fails **differently**, and the failure shape is the clue:

| Layer | Typical failure | Who sets it |
|---|---|---|
| client / harness | refused before any request (`...limit exceeded`), or silently serialized | the CLI you use |
| account / plan | `429` with *your* quota in the body | the vendor's billing |
| upstream model | `429` with a *provider* name / capacity message | the model provider |
| transport | timeout, TLS handshake failure, `TIME_WAIT` growth | your OS + network path |

每一层的**崩法不一样**，崩的形状就是线索：客户端层是**请求还没发就被拒**（或者被偷偷串行化）；账号层是 `429` 里写着**你自己的配额**；上游层是 `429` 里写着 **provider 名字 / 容量不足**；传输层则表现为超时、TLS 握手失败、`TIME_WAIT` 越堆越多。

---

## Reproduction

The whole method is a probe that timestamps itself:

```bash
echo "t01 start: $(date +%H:%M:%S.%N)"; sleep 6; echo "t01 end: $(date +%H:%M:%S.%N)"
```

Launch `N` of these in parallel, collect start/end pairs, then compute the **peak overlap** (for each start time, how many intervals cover it). *Peak concurrency* = the max of that. "All online at once" ⇔ `max(start) < min(end)`.

Then **bisect `N` upward** and, crucially, **classify the failure** at each step:

- refused with a client error before any network I/O → you hit **layer 1**
- `429` whose body mentions your account → **layer 2**
- `429` whose body mentions a provider / shared pool → **layer 3**
- hang / timeout / TLS error → **layer 4**

Two hygiene rules that make the difference between data and noise:

- **Drain sockets between runs.** Check the `TIME_WAIT` count first; if it's in the dozens+, wait (Windows default ~2 min) before measuring.
- **Use a real credential.** A dummy key that gets a fast `401` measures the *connection* capacity, never the *inference* concurrency. Those are different questions.

复现方法就是一根自己打时间戳的探针：`echo start; sleep 6; echo end`。并行发 `N` 个，收齐 start/end 后算**峰值重叠数**（每个 start 时刻被多少个区间覆盖），峰值并发就是它。判定“全员同时在线”＝`max(start) < min(end)`。

然后**把 `N` 往上二分**，关键是在每一步**判断失败类型**（见上表：请求没发就被拒=第1层；`429` 提你账号=第2层；`429` 提 provider/共享池=第3层；超时/TLS 错=第4层）。

两条卫生规则，决定你拿到的是数据还是噪音：**① 两轮之间把套接字排干**（先看 `TIME_WAIT` 计数，几十以上就等两分钟再测）；**② 用真钥匙测**（假钥匙秒回 `401`，那只测了建连容量，跟推理并发是两回事）。

---

## Observations (measured)

| Layer | Observation | Note |
|---|---|---|
| client / harness | foreground tool calls: **serialized** (a batch of 6 finished strictly one after another); background tasks: **~unbounded**, but *dispatched* at ≈10/s | "no limit" here really means "you are limited by how fast the harness can start them" |
| client / harness | sub-agents: **2** (ZCode); **8+** (dsh) | looks like a *slot model*: extras are rejected, then one retries when a slot frees |
| upstream model | provider A: **no visible cap** (300/300) | needs a real key to be meaningful |
| upstream model | provider B: **≈100** in-flight, then `429 limitation` | a hard provider-side cap |
| upstream model | free gateway: **4 / 30**, all 429s from the **shared pool** | adding keys does not help by design |
| upstream model | another free tier: raw HTTP **403** — "can only be used from within \<the CLI\>" | the free tier is *client-bound*, not just rate-limited |
| transport | 200 concurrent through a `CONNECT` proxy: **174/200**, failures = TLS handshake timeouts | the proxy is now the wall, not the model |
| transport | consecutive runs degrade (300 → 228) purely from `TIME_WAIT` | not a limit; a hygiene artifact |

| 层 | 观察 | 备注 |
|---|---|---|
| 客户端 | 前台工具调用**串行**（一批 6 个严格一个接一个）；后台任务**近乎无上限**，但**派发**速率 ≈10/秒 | 这里的“无上限”其实是“受限于外壳能多快启动它们” |
| 客户端 | 子代理：**2 个**（ZCode）；**8+**（dsh） | 像是**槽位模型**：多出的直接拒，然后有 1 个等释放后自动补位 |
| 上游 | 厂商 A：**看不出闸**（300/300） | 得用真钥匙才有意义 |
| 上游 | 厂商 B：在途 **≈100**，之后 `429 limitation` | provider 侧硬上限 |
| 上游 | 免费网关：**4/30**，429 全来自**共享池** | 加 key 按设计无效 |
| 上游 | 另一个免费档：裸 HTTP **403**，“只能从该 CLI 内使用” | 免费档是**绑定客户端**的，不只限速 |
| 传输 | 经 `CONNECT` 代理 200 并发：**174/200**，失败＝TLS 握手超时 | 这时墙是代理，不是模型 |
| 传输 | 连跑递减（300→228），纯粹来自 `TIME_WAIT` | 这不是上限，是卫生问题 |

---

## Cross-Harness: the client layer, measured four ways

Four coding harnesses — **ZCode, Claude Code, Codex, dsh** — same machine, same couple of days. Every number below is a **client-layer** property. The models underneath differed, but re-testing with different drivers only moved numbers where a note says so.

| Harness | foreground tool calls | background | sub-agents | other |
|---|---|---|---|---|
| **ZCode** | **serialized** — a batch of 6 ran strictly one after another | unbounded, but dispatched ≈10/s | **2**, hard-refused (`user concurrency limit exceeded`) | — |
| **Claude Code** | runs in parallel | — | **0 in a non-git cwd**; **≥10 in a git one** (20 launched → 9 + 10, ~5 min apart †) | writable sub-agents need a git worktree |
| **Codex** | **truly parallel** (6/6 and 16/16 fully overlapped) | — | none exposed | accepted **80** parallel calls; real peak overlap only **27** |
| **dsh** | **serialized** — *by design*: shell tools don't declare themselves concurrency-safe | **hard cap 10 per owner** | **8** (background type, hard-refused) / **10** (foreground pool) | workflow fan-out = `min(16, cores − 2)` = **14** |

† The ~5-minute gap was a **single early observation and did not reproduce** in a later 12-probe rerun (all 12 dispatched within ~16 s). Treat it as transient, not a stable gate.

Three things this table makes visible:

- **"Does foreground parallelize?" splits the field.** Codex is fully parallel. dsh is serialized *on purpose* — shell commands have side effects, so they are barred from the pool. ZCode is serialized with no stated reason. Whether the serialization is *a design decision* or *an accident* is invisible from the outside — which is precisely why the bare number tells you nothing.
- **"10" keeps appearing.** dsh's tool pool = 10, dsh's background cap = 10, ZCode's dispatch rate ≈ 10/s. Round, human-chosen defaults — not physics.
- **Check whether the cap is configurable.** dsh exposes every limit as a setting (some via a UI card); the `8` is a *default*, not a wall. ZCode's hard-coded 2-cap is a fundamentally different obstacle from an 8-cap you can raise.

| 外壳 | 前台工具调用 | 后台 | 子代理 | 其他 |
|---|---|---|---|---|
| **ZCode** | **串行**——一批 6 个严格一个接一个 | 近无限，但派发 ≈10/s | **2**，硬拒（`user concurrency limit exceeded`） | — |
| **Claude Code** | 并行 | — | **非 git 目录 0 个**；**git 目录 ≥10 个**（派 20 个 → 9+10，隔 ~5 分钟 †） | 可写子代理需要 git worktree |
| **Codex** | **真并行**（6/6、16/16 全重叠） | — | 无此接口 | 接受 **80** 个并行调用；实际峰值重叠仅 **27** |
| **dsh** | **串行**——**设计如此**：shell 工具不自称并发安全 | **每 owner 硬顶 10** | **8**（后台型，硬拒）/ **10**（前台池） | workflow 扇出 = `min(16, 核数−2)` = **14** |

† 那个「~5 分钟」是**单次早期观察，后来发 12 个探针重测没复现**（12 个全在 ~16s 内派发）。按**偶发态**看，不是稳定闸。

这张表让三件事变得可见：

- **"前台到底并行吗"把四家劈开。** Codex 完全并行；dsh 是**故意**串行——shell 命令有副作用，所以被挡在并发池外；ZCode 串行但没给理由。串行究竟是**设计决定**还是**意外遗留**，从外面看不出来——这正是"光一个数字没用"的原因。
- **"10" 反复出现。** dsh 的工具池 = 10、dsh 的后台顶 = 10、ZCode 的派发率 ≈ 10/s。圆整的、人为挑的默认值——不是物理。
- **看这个上限能不能配。** dsh 把所有上限都暴露成设置项（有的还有 UI 卡片）；那个 `8` 是**默认值**，不是墙。ZCode 那个**硬编码**的 2 上限，和一个**你能调高**的 8 上限，是完全不同性质的障碍。

---

## Potential Causes

- **Layers 1–2 exist for cost and fairness.** A coding agent's sub-agent slots are there because each agent burns context and tokens; the vendor gates concurrency to keep one user from eating the plan. That is a *policy* number, not a physics number.
- **Layer 3 exists because the provider has finite GPUs.** In-flight caps and shared free pools are capacity management. When a free tier is shared across all users, *your* ceiling is set by strangers, and it moves hour to hour.
- **Layer 4 is your own machine.** Sockets in `TIME_WAIT` are not a limit — they're a consequence of not reusing connections. A client that never keep-alives will "degrade" under repeated load for reasons that have nothing to do with the model.

- **第 1–2 层是成本和公平性的产物。** 编程 agent 的子代理槽位，是因为每个 agent 都烧上下文和 token；厂商设闸是防止一个用户吃穿套餐。那是**策略数字**，不是物理数字。
- **第 3 层存在是因为 provider 的卡是有限的。** 在途上限和共享免费池都是容量管理。免费档被所有用户共享时，**你的天花板是由陌生人决定的**，而且每小时都在动。
- **第 4 层是你自己的机器。** `TIME_WAIT` 不是上限，是“不重用连接”的后果。一个从不 keep-alive 的客户端，会在重复压力下“衰减”，原因和模型毫无关系。

---

## Engineering Workarounds

1. **Never quote a concurrency number without its scope.** A usable claim states: *the layer*, *the model/provider*, *real or dummy key*, *socket state*, and *the date*. "300 concurrent" alone is not information.

2. **Bisect until it breaks, then name the layer.** Don't stop at "it failed." The failure shape (refused / account-429 / provider-429 / timeout) is the whole answer.

3. **Plan your orchestration to the *smallest* applicable layer.** If your client caps sub-agents at 2, a 10-way fan-out design is fantasy no matter what the model can do. Design for the narrowest gate on the path.

4. **Don't add keys to fix a shared-pool limit.** If the 429 comes from layer 3, more keys change nothing — the gate is upstream of you. Route to another provider, or another model, instead.

5. **Treat "free tier" as client-bound and ephemeral.** A free tier can be tied to a specific client, a shared pool, and a daily counter that can be tightened without notice. Never build load-bearing automation on it.

6. **Make the number reproducible.** Ship the probe (timestamp + sleep + overlap math) with the claim, so anyone — including future you — can re-run it on their own machine. Numbers without a reproduction method are folklore.

7. **Ask whether the cap is configurable before designing around it.** A limit exposed in settings (even behind a UI card) is a default you can raise; a hard-coded one is a wall. Design for walls, tune for defaults.

1. **报并发数必须带口径。** 一个能用的结论要写清：**哪一层**、**哪个模型/provider**、**真钥匙还是假钥匙**、**套接字状态**、**哪天测的**。光一句“300 并发”不是信息。
2. **二分到崩，然后给层命名。** 别停在“失败了”。失败形状（被拒 / 账号 429 / provider 429 / 超时）本身就是全部答案。
3. **按**最窄**的那一层设计编排。** 如果客户端子代理上限是 2，那 10 路扇出的设计就是幻想，跟模型多强无关。按路径上最窄的闸来设计。
4. **别靠加 key 去解共享池的上限。** 429 来自第 3 层的话，加 key 没用——闸在你上游。应该换 provider 或换模型。
5. **把“免费档”当成绑定客户端、且随时会变的东西。** 免费档可以绑特定客户端、走共享池、还有可能被悄悄收紧的每日计数。别把撑得住业务的自动化建在上面。
6. **让数字可复现。** 把探针（时间戳+睡眠+重叠计算）和结论一起发出来，任何人（包括未来的你）都能在自己机器上重跑。没有复现方法的数字就是民间传说。

7. **在围着上限做设计之前，先问它能不能配。** 暴露在设置里的上限（哪怕藏在 UI 卡片后面）是**默认值**，你能调高；硬编码的才是**墙**。**照墙设计，拿默认值调优。**

---

## Caveats

- Everything here is **point-in-time** and **machine-specific**. Provider caps, free-tier rules, and client slot counts all change, sometimes within weeks.
- The "layers" are a mental model, not a formal spec. Real stacks often collapse two layers into one, or add their own.
- Where a cause is inferred rather than proven, it is written as a plausibility, not a fact. The *observations* are reproducible; the *explanations* are hypotheses.

- 这里的一切都是**某个时间点、某台机器**的。Provider 上限、免费档规则、客户端槽位数都会变，有时几周就变。
- “分层”是个心智模型，不是正式规格。真实系统经常把两层并成一层，或者自己再加一层。
- 凡属推断而非实锤的原因，都按“可能性”写，不按事实写。**观察**可复现，**解释**是假设。
