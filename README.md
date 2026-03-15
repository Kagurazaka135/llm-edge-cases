LLM Edge Cases

A collection of reproducible edge cases and unusual behaviors observed in large language models.

This repository documents real-world phenomena encountered while building LLM-based systems and workflows.

All cases include reproduction steps and possible explanations.

---

Contents

- Context Source Confusion
- Long Context Keyword Loss
- Model Self-Attribution Behavior
- Prompt Instruction Ignoring
- LLM Validation Failure

---

Motivation

While working on LLM-based workflows (Dify automation pipelines), I encountered several interesting behaviors that are rarely documented.

Instead of treating them as random bugs, I tried to:

- reproduce them
- analyze possible causes
- document engineering workarounds

This repository serves as a small collection of such cases.

---

Structure

cases/

case-01-context-source-confusion.md  
case-02-long-context-keyword-loss.md  
case-03-self-attribution.md  

Each case includes:

- phenomenon
- reproduction steps
- observations
- possible causes
- engineering mitigation

---

Notes

The explanations provided here are **hypotheses based on observation** rather than confirmed internal mechanisms.

However, all cases described are reproducible.

---

Author

Personal experiments while exploring LLM boundaries.
