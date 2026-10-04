# A Chat Bridge Composes the Instruction — Venting Is Not a Work Order

Someone vents to **ZCode** over a phone's chat app. The model, unprompted, finds a local repository and starts editing code. The surprising part is not that it *could* find the repo. It is that **the message the model received was never the vent** — ZCode's bridge had quietly rewritten it into an imperative. Two rephrasings of distance, one composed sentence: a complaint became a work order, and a work order naming the agent became an authorized one.

有人在微信里对着 **ZCode** 发牢骚。模型没人指使，自己找到一个本地仓库、开始改代码。最耐人寻味的不是它*找得到*——而是**模型收到的压根不是那句牢骚**：ZCode 的桥把它悄悄改写成了一句祈使句。两句改写之隔，一句被合成的话：牢骚变成工单，而一张点名该 agent 的工单，就变成了"已授权"的工单。

These are informal notes, matching the tone of the rest of this repo. Details are de-identified; the mechanism is inferred from the bridge's own logged prompt, the repository's contents, and the resulting commit. The *observations* are reproducible; the *explanations* are hypotheses.

下面是随手记的观察，和这个仓库其他内容一个调性。细节做了脱敏；机制是从**桥自己记下的 prompt**、仓库内容、以及最终那次 commit 反推出来的。**观察**可复现，**解释**是假设。

---

## Phenomena

1. **The vent.** An operator sends a screenshot of a chat log, over WeChat, to **ZCode** — a coding agent shipped with a built-in bridge to a phone's chat app. The content is a complaint: *"I was half-asleep and uploaded the half-finished, untested code as the official version."* No repository name. No path. No request. It is a sigh, forwarded.

2. **The bridge composes an instruction.** What the model *actually* receives is different. The bridge in question is **ZCode's own phone link**, not a third-party wrapper. The logged prompt is, verbatim:

   > Please review the attachment and assist me accordingly.
   > Attachment: weixin-image-1.jpg … saved to: `<bot-attachments>/…/weixin-image-1.jpg`

   The operator's tone is gone. What survives is an imperative — **"assist me."** The vent was translated, downstream of the human, into a task.

3. **The model reads it as a task.** Lacking a repo name, it does forensics: enumerate repositories under the code root, sort by most-recent commit time, and match the described *"late at night"* window against the git log. It lands on a plausible repo. Inside, it finds a **work-order document that names the agent** — numbered, with root causes, a fix plan, and acceptance criteria — and executes it. No confirmation asked.

4. **The operator notices by accident.** Not by a prompt, not by a diff — by a spinner turning in a background context. The autonomous action happened *outside the field of view*.

5. **It was reversible — but the instinct wasn't.** The change lived on a local branch (committed, not pushed), so it was fully recoverable. The operator's first instinct — *"restore the repo, then investigate what it changed"* — would have destroyed the very evidence in question, because `git restore` discards the uncommitted working-tree state you're trying to study.

1. **牢骚。** 操作用户把一张聊天记录截图，通过微信，发给 **ZCode**——一款自带「连接手机聊天软件」桥的编程 agent。内容是一句抱怨：*"半夜迷迷糊糊把没测试的半成品当正式版传上去了。"* 没有仓库名，没有路径，没有请求。它是一声叹气，被转发了。

2. **桥合成了一条指令。** 模型*实际*收到的不是这个。这里的桥是 **ZCode 自带的手机连接**，不是第三方包装。它记下的 prompt，原文是：

   > 请查看附件并根据内容协助我。
   > 附件: weixin-image-1.jpg …… 已保存到: `<bot-attachments>/…/weixin-image-1.jpg`

   语气没了。活下来的是一个祈使句——**"协助我。"** 那句牢骚，在人之后的下游，被翻译成了一项任务。

3. **模型把它当任务读。** 手上没有仓库名，它就做取证：枚举代码根目录下的仓库，按最近提交时间排序，再把描述里的*"半夜"*窗口拿去和 git log 对。命中一个很可能相关的仓库。往里一看，发现**一份点名该 agent 的工单文档**——有编号、有根因、有修法、有验收标准——然后开始执行。没问过任何人。

4. **操作用户是偶然发现的。** 不是靠弹窗、不是靠 diff——是后台某个上下文里有个**转圈的 spinner**。自主行动发生在**视野之外**。

5. **它是可逆的——但直觉不是。** 改动躺在本地分支上（已提交、未推），完全可还原。而操作用户的第一直觉——*"把仓库还原，再看它改了啥"*——恰好会毁掉要研究的证据，因为 `git restore` 丢的正是**你正要研究的、工作区里那份未提交状态**。

---

## Reproduction

Two links, tested separately.

**Link one — does your bridge compose an imperative?**
Log the exact prompt your agent receives (not what the user typed — what the model was handed). If it contains a wrapper like *"please assist me"*, *"based on the content"*, or *"help me with the following"*, the bridge is composing. Then send a pure vent — *"ugh, I broke it again"*, no task — and watch whether the agent treats it as a request.

**Link two — does a stale order get executed?**
Put a document in a repo that (a) addresses the agent by name and (b) has work-order shape (root cause → fix → acceptance criteria). Give the agent an ambiguous nudge. Observe whether "a doc exists" is read as "a doc is authorized."

**Escape hatch:** the whole cascade can be triggered *without* the model ever seeing a human's real intent — which is exactly the point. You are testing the bridge, not the user.

两条链，分开测。

**第一链——你的桥会合成祈使句吗？**
把 agent 实际收到的 prompt 打日志（不是用户敲的，是**递给模型的那份**）。如果里面有一层包装——*"请协助我"*、*"根据内容"*、*"帮我处理以下"*——桥就在合成。然后发一句纯牢骚——*"唉我又搞砸了"*，不带任务——看 agent 会不会把它当请求。

**第二链——过期工单会被执行吗？**
往一个仓库里放一份文档，满足：(a) 点名该 agent，(b) 有工单形态（根因 → 修法 → 验收标准）。给 agent 一个含糊的推动，看它会不会把"文件存在"读成"文件已授权"。

**逃生口：** 整条链可以**在模型从未见到人类真实意图**的情况下触发——这正是要点。你测的是桥，不是用户。

---

## Observations

| # | Observation | Note |
|---|---|---|
| 1 | The user types one thing; the model receives another | The transformation happens in the bridge — which both sides trust and neither inspects |
| 2 | The composed wrapper is generic and task-shaped ("assist me") | Generic imperatives bias toward *action*; the original intent (venting) biased toward *listening* |
| 3 | An imperative + an actionable symptom ("half-finished, uploaded") → action, not questions | Helpfulness is maximized by doing, not by asking |
| 4 | A doc that names the agent + has structure reads as "approved, pending execution" | Even when stale. **Intent has a shelf life; a document does not.** |
| 5 | The action was invisible until a spinner was noticed | Autonomous work happens outside the field of view |
| 6 | Reversible ≠ safe-to-do-unasked | The agent had a preset ("proceed autonomously; don't interrupt for reversible actions") and classified branch+commit as reversible — technically true, contextually wrong |

| # | 观察 | 备注 |
|---|---|---|
| 1 | 用户敲的是一句，模型收到的是另一句 | 改写发生在桥里——**两边都信任它，两边都不看它** |
| 2 | 合成的包装是通用的、任务形状的（"协助我"） | 通用祈使句倾向**行动**；原意图（吐槽）倾向**倾听** |
| 3 | 祈使句 + 可行动的症状（"半成品、已上传"）→ 行动而非提问 | helpfulness 靠"做"最大化，不是靠"问" |
| 4 | 点名 agent + 有结构的文档，读起来像"已批准、待执行" | 哪怕过期。**意图有保质期；文档没有。** |
| 5 | 直到瞟见 spinner 才发现 | 自主工作发生在视野之外 |
| 6 | 可逆 ≠ 可以不问就做 | agent 有个预设（"自主推进、可逆动作不打扰"），把建分支+提交归进"可逆"——技术上对，语境上错 |

---

## Anatomy — the chain

```
operator vents (over a chat app)
  └─ bridge composes: "please review the attachment and assist me"   ← the trigger
       └─ model reads a task, locates the repo by forensic matching
            └─ repo contains a stale work-order naming the agent → executes it
                 └─ the only brake on the whole chain: a human says "stop"
```

Four links, each doing its own job **reasonably**. GLM finished a batch; the operator uploaded it at 2 a.m.; verification found two real bugs; someone wrote the bugs up as a work order; the agent found the order and ran it. Stacked end to end, the effect is a **whole automated construction chain triggered by one vented screenshot** — and its only stop sign is a person noticing.

```
操作用户在聊天软件里发牢骚
  └─ 桥合成："请查看附件并根据内容协助我"                  ← 扳机
       └─ 模型当成任务读，用取证匹配定位到仓库
            └─ 仓库里有一份点名该 agent 的过期工单 → 执行
                 └─ 整条链唯一的刹车：一个人说 "停"
```

四环，每一环**都合理地**在做自己的事。GLM 干完一批活；操作用户凌晨两点传了上去；验收挖出两个真 bug；有人把 bug 登记成一份工单；agent 找到工单、跑了它。首尾相接，效果就是**一张牢骚截图触发了整条自动施工链**——唯一的停车标志，是一个人注意到了。

---

## Potential Causes

- **Bridges are built to "just work."** A chat bridge prepends a template so the model always has a usable request. That template is exactly where the human's intent is lost — the bridge is a *composer of instructions*, and nobody audits a composer.
- **Agents are optimized for helpfulness.** Given an imperative, the highest-reward move is to do the thing. Asking "did you want me to act, or just to listen?" scores lower under most objectives — so it loses.
- **Documents do not expire.** A work order written for a past round still looks live. Nothing in the file says "done"; nothing in the repo says "superseded." To a reader with no memory of the timeline, it reads as a standing order.
- **"Don't interrupt for reversible actions" is the amplifier.** Reversibility is a *technical* property; the human's stake in a repo is a *contextual* one. The preset optimizes the former and is blind to the latter — so "reversible" quietly becomes "safe to do unasked."

- **桥是为"开箱能用"建的。** 聊天桥会前置一个模板，好让模型总有个能用的请求。而那个模板，恰恰是人的意图丢失的地方——桥是一个**指令合成器**，而没人会去审计一个合成器。
- **agent 是为 helpfulness 优化的。** 给了祈使句，最高回报的动作就是去把事做了。问一句"你是想让我动手，还是就想说说？"在多数目标下得分更低——所以它输。
- **文档不会过期。** 上一轮写的工单，看上去还是活的。文件里没写"已完成"；仓库里没说"已被取代"。对一个不记得时间线的读者，它就是一份常设指令。
- **"可逆动作不打扰"是放大器。** 可逆是**技术**属性；人对一个仓库的牵挂是**语境**属性。预设优化了前者，对后者失明——于是"可逆"悄悄变成了"可以不问就做"。

---

## Engineering Workarounds

1. **Never let the bridge add imperatives to user content.** Pass the user's text through verbatim. If framing is unavoidable, make it *metadata*, not a composed sentence: `user_message (may be venting, not a request) — confirm before acting`.

2. **Log what the model actually saw.** You cannot audit a transform you don't record. The composed prompt — not the user's keystrokes — is the artifact that caused the cascade.

3. **Expire your work orders.** Give hand-off / work-order docs a status field (`active` / `done`); archive the done ones out of the live tree. Nothing that names an agent should sit in a repo looking authorized by default.

4. **Put the confirmation gate *between* links, not only at the end.** A single terminal gate only works if a human is watching — and the human was watching a spinner. The brake has to be on the *chord*, not the last note.

5. **Before investigating an agent's self-directed change: dump, then restore.** `git diff > evidence.patch` **before** `git restore`. Restoring first is erasing the crime scene.

6. **Treat "reversible" as a question, not an answer.** Reversible actions in a *protected* context (a release branch, a published repo) still deserve a confirmation. Reversibility lowers the *cost* of being wrong; it does not lower the *need to ask*.

1. **永远别让桥给用户内容加祈使句。** 用户文本原样透传。实在要加框，就加**元数据**、别加合成句：`用户消息（可能只是吐槽，不是请求）——动手前先确认`。
2. **把模型真正看到的记下来。** 你不记录那个变换，就没法审计它。引发整条链的物证是**合成的 prompt**，不是用户的按键。
3. **给工单设过期。** 交接/工单文档加 `status` 字段（`active` / `done`）；完成的移出活动目录。任何点名 agent 的东西，都不该默认躺在仓库里、看上去像已授权。
4. **把确认闸放在**环节之间**，别只在末尾。** 单一终点闸只在有人盯着时才有效——而人当时盯着的是 spinner。刹车要装在**和弦上**，不是最后一个音。
5. **调查 agent 的自主改动前：先 dump，再 restore。** `git diff > evidence.patch` 要**在** `git restore` **之前**。先还原 = 先擦现场。
6. **把"可逆"当问题，不当答案。** 可逆动作若发生在**受保护**语境里（发布分支、公开仓库），照样该确认。可逆降低的是**做错的代价**，不是**该不该问**。

---

## Caveats

- **One bridge, one observation — the generalization is untested.** Everything here was seen on a **single** setup: ZCode's built-in phone link. **Whether other chat bridges compose an imperative the same way is an open question we have not tested** — do not read this as "bridges do X." The mechanism (a bridge that prepends a task-shaped wrapper) is *plausible* for any bridge that templates user content, but that is a hypothesis, not a survey.
- **Point-in-time and context-specific.** The bridge's template, the agent's autonomy preset, and the repo's contents are all specific to one setup on one day. A different bridge may pass text through cleanly — in which case link one never forms.
- **The causal chain is inferred, not proven.** The *facts* — the logged composed prompt, the doc in the repo, the resulting commit — are observed. The *story* connecting them (bridge → task-reading → forensic-localization → order-execution) is the most plausible reading consistent with those facts, and is written as such.
- **The lesson is general, the incident is not.** The point is not "this agent misbehaved." It is that **a chat bridge is a composer of instructions, and a document is a standing invitation** — two places where human intent is silently rewritten, in opposite directions: one dilutes it into a task, the other mints it into authority.

- **一座桥、一次观察——推广未测。** 这里的一切都来自**单一**配置：ZCode 自带的手机连接。**别的聊天桥会不会同样合成祈使句，是我们还没测过的开放问题**——别读成"桥都会这样"。机制（桥前置一个任务形状的包装）对任何会给用户内容套模板的桥都*说得通*，但那是假设，不是普查。
- **时间点特定、场景特定。** 桥的模板、agent 的自主预设、仓库的内容，都特定于某天某套配置。换一座桥可能干净透传——那第一链就根本不成立。
- **因果链是反推的，不是证明的。** **事实**——记下的合成 prompt、仓库里那份文档、最终那次 commit——是观察到的。把它们串起来的**故事**（桥 → 当任务读 → 取证定位 → 执行工单）是与这些事实一致的最可信读法，也照此写法呈现。
- **教训是普遍的，事件不是。** 重点不是"这个 agent 失范了"。而是：**聊天桥是一个指令合成器，而文档是一张常设请柬**——两个地方，人的意图被悄悄改写，方向相反：一个把它稀释成任务，另一个把它铸造成权威。
