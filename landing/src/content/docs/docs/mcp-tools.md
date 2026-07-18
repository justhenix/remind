---
title: MCP tools
description: The remindy_recall and remindy_capture tools your agent calls.
---

remindy exposes two MCP tools. Any MCP-compatible client can call them.

## remindy_recall

Called **before** writing or editing code. Returns the known standards to avoid.

| | |
| --- | --- |
| **Input** | `task_context: string` |
| **Returns** | `{ rules: string[], tokens: number }` |

Behavior: list stored rules via `documents.list` → filter by tag scope → rank by
keyword relevance × burn count → trim to a roughly 100-token budget → return the
formatted caveman rules.

The tool description is imperative on purpose: *always call before writing or editing
code.*

## remindy_capture

Called when the agent detects any dissatisfaction with its output — an explicit
correction, or an implicit signal like "meh", "i hate it", or "why are you doing
that" — or invoked directly by you. The injected project rule tells every agent to
capture the taste itself, so you rarely trigger this by hand.

| | |
| --- | --- |
| **Input** | `mistake: string, tag?: Tag` |
| **Returns** | `{ id: string, caveman: string, burns: number }` |

Behavior: an OpenAI-compatible model compresses the correction to
`[TAG] anti-pattern → fix` → dedup against existing rules (same tag plus matching
anti-pattern/fix) → if it matches, increment the burn count; otherwise insert a new
rich memory and its caveman projection.

`Tag` is one of `UI`, `COPY`, `CODE`, `COMMIT`, `SEC`, `REQ`, `PERF`.
