---
title: Repo inference
description: How remindy seed infers standards from your repository so recall is useful on the first run.
---

`remindy seed` scans your repository and infers one standard per tag from real
signals, so recall returns personalized guidance on the very first run, no cold start
and no correction loop required.

## Signals

| Tag | Signal |
| --- | --- |
| **UI** | inline styles vs design tokens in your styles |
| **COPY** | AI-slop words in your README and user-facing strings |
| **CODE** | React derived-state patterns or a loose tsconfig |
| **SEC** | hardcoded secrets and `.env` gitignore coverage |
| **COMMIT** | conventional-commit adherence in your git log |
| **REQ** | presence of specs / requirements docs |

Where a signal is absent, a curated starter rule fills the gap, so recall always has
something useful to return.

## Deterministic by design

Detection is deterministic and never fails. The LLM step is optional and only polishes
wording, it never blocks a seed, and a rule persists even if the model is unreachable.
Run it any time:

```bash
npx remindy seed
```
