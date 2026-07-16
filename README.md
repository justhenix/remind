# remind

The portable taste & standards layer for AI coding agents. Teach any MCP-compatible
agent how you want code written once; it stops violating your standards, in every
tool, for about 15 tokens a turn.

## Phase 1 status — offline proof of concept

This is the barebone Phase 1 build. It proves the remind loop end-to-end with
**zero external services**: no Supermemory instance, no Ollama, no API keys. Every
backend that will eventually be real is hidden behind a small interface with an
offline default implementation plus a clearly marked stub adapter.

Offline defaults used here:

- `InMemoryStore` — in-process memory store (dedup via normalized tag + anti-pattern).
- `TemplateCompressor` — deterministic correction parser (`antiPattern → fix`).
- `KeywordEmbedder` — Jaccard token-overlap relevance scoring.
- Seeded starter TASTE pack so `remind_recall` is useful on first run.

## The loop

`remind_recall(task_context)` returns a tiny block of known standards to avoid,
ranked by relevance × burn count and trimmed to a ~100 token budget.
`remind_capture(mistake, tag?)` compresses a correction into a caveman rule,
dedups against existing rules, and either inserts a new rule or increments its
burn count.

Caveman rule format: `[TAG] anti-pattern → fix (×N)` where
`TAG ∈ {UI, COPY, CODE, COMMIT, SEC, REQ, PERF}`.

## Build & test

```bash
npm install     # no external services required
npm run build   # tsc -> dist/
npm test        # vitest run (single pass, no watch)
```

## Run

The MCP server is a long-lived stdio process. Start it yourself (not from an
agent tool call):

```bash
npm run dev     # node dist/server/index.js (stdio transport, offline defaults)
```

CLI plan (Phase 1 prints steps only, installs nothing):

```bash
node dist/bin/remind.js init
```

## Wiring real backends (next)

The following adapters are stubs marked with `// TODO(verify)`. Each must be
confirmed against upstream docs before use — none of the upstream signatures are
assumed here:

- `src/memory/supermemory-local-store.ts` — Supermemory Local over HTTP.
  See https://supermemory.ai/docs/add-memories and https://supermemory.ai/docs/search
- `src/capture/ollama-compressor.ts` — llm-bridge + a local Ollama model.
  See the llm-bridge repository linked in `.kiro/steering/docs.md`.

Configure real endpoints via `.env` (see `.env.example`). These variables are
not read yet in Phase 1.
