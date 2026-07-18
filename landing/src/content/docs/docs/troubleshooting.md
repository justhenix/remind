---
title: Troubleshooting
description: Fixes for the backend badge, empty recall, and slow capture.
---

## Backend badge is red / rules not shared across tools

Supermemory Local isn't reachable.

- Start `supermemory-server`, confirm `SUPERMEMORY_API_KEY` in `.env` matches its first-boot key, then run `remindy doctor`.
- Until the backend reads Supermemory Local, memory is per-editor and lost on restart.

## Recall returns nothing

The store is empty. Run `remindy seed`, or capture a rule from the [dashboard](/docs/dashboard/).

## Capture is slow or gives plain wording

The LLM provider is unreachable, so capture used the fallback template.

- Set a working provider via [BYOK](/docs/byok/) for sharp phrasing.
- CPU-only? Ollama is slow, use a small model (`qwen2.5-coder:3b`) or a cloud provider.

## `init` reports no clients detected

remindy detects editors by their config dir (`.kiro`, `.cursor`, `.windsurf`, `.agents`). If none exist, `init` prints the MCP entry to paste in manually.
