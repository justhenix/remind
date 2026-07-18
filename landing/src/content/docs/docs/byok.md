---
title: "BYOK: bring your own key"
description: Point remindy's compression step at Ollama, OpenAI, Anthropic, or b.ai.
---

Compression at capture time runs on any OpenAI-compatible model. Four providers are
built in, pick whichever you have a key for.

| Provider | Runs | Example model |
| --- | --- | --- |
| **Ollama** | local, on-machine, free (default) | `qwen2.5-coder:3b` |
| **OpenAI** | cloud | `gpt-5.6-luna` |
| **Anthropic (Claude)** | cloud, OpenAI-compatible endpoint | `claude-haiku-4-5` |
| **b.ai** | cloud | `claude-sonnet-5` |

## From the dashboard

Open the **provider** panel, pick a provider (fields prefill sensible defaults), paste
your key, and save. It is written only to your gitignored `.env`.

## From the CLI

```bash
remindy config                                          # show current (key masked)
remindy config set --provider openai    --key sk-...     --model gpt-5.6-luna
remindy config set --provider anthropic --key sk-ant-... --model claude-haiku-4-5
remindy config set --provider bai       --key ...        --model claude-sonnet-5
remindy config set --provider ollama    --model qwen2.5-coder:3b
```

:::caution
Keys never leave your machine and are never logged. Restart the MCP server or editor
after changing them so the new config is picked up.
:::

Compression only polishes wording. If the provider is unreachable, remindy falls back
to a deterministic template so capture never blocks, you just get plainer phrasing.
