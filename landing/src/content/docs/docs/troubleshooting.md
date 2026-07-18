---
title: Troubleshooting
description: Fixes for the backend badge, empty recall, and slow capture.
---

## Backend badge is red, or rules are not shared across tools

Supermemory Local isn't reachable. Start it, confirm `SUPERMEMORY_API_KEY` in `.env`
matches the key it printed on first boot, then run `remindy doctor`. Until the backend
reads Supermemory Local, memory is per-editor and forgotten on restart.

## Recall returns nothing

The store is empty. Run `remindy seed` to populate it from your repo, or capture a rule
from the [dashboard](/docs/dashboard/).

## Capture is slow or falls back to plain wording

The LLM provider is unreachable. remindy falls back to a deterministic template so
capture never blocks, but set a working provider via [BYOK](/docs/byok/) for the best
phrasing. On CPU-only machines, local Ollama is slow, a small model such as
`qwen2.5-coder:3b` or a cloud provider keeps capture snappy.

## `init` reports no clients detected

remindy detects editors by their project config directory (`.kiro`, `.cursor`,
`.windsurf`, `.agents`). If none exist yet, `init` prints the exact MCP server entry to
paste into your client's config manually.
