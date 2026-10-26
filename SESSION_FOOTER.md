# Dual Session and Window usage — implementation contract

## Accounting vocabulary

- Session totals are served by native `tokenUsage`, and are never recomputed by the plugin.
- Window totals are served by the plugin-owned `statusbarWindowUsage` Session Projection. Each key contains disjoint cache-read, uncached input, cache-write and output counters.
- A Window begins at Session creation, then restarts immediately after each successful `compaction/end` (event has no `error`). `compaction/start`, `compaction/summary`, failed `compaction/end` and `compaction/prune` do not reset billing epochs.
- The projection folds the same provider usage samples as native token-meter: authoritative `assistant/message.data.usage` wins over stream usage, packed `chunk(type=usage)` is read from the end, a repeated same-step sample replaces the previous one, and `llm/retry-started` closes that replacement scope.
- Reasoning tokens already belong to output. Summarization-only LLM calls are not counted by either Native Session projection or the plugin Window projection.
- Per-Turn counters are never recomputed either: they are the shipped Turn-tail Chat node's `tokenUsage` for that Turn, read through the public per-Turn node reader.
- Schema-validated JSON state is replayable and checkpointed by DSH Session Projection Registry. No in-memory browser-only counters or checkpoint snapshots need to be persisted by this plugin.

## UI

- Only the native `conversation.composer.dock` `usage` item (order 1, priority -1) is overridden. `activity`, branching and feedback remain unchanged.
- Per-Turn usage keeps the shipped pill, dialog and gating, but its text is rewritten: a null-rendering `conversation.chat.turnTail` entry (`turn-usage-label`) reads `nodes.turnDataSource(turn, 'turn-tail')` and publishes `cacheReadTokens/uncachedInputTokens/outputTokens` (compact counters) on the `[data-turn-tail]` root as `data-dsc-turn-usage` plus the quoted `--dsc-turn-usage-label`. A scoped CSS rule hides the shipped `usage <total> tok` label and renders the counters from that custom property. The label is always on, and an absent cache-read bucket leaves the native total in place rather than showing a fabricated `0`. Values carry no units of their own. The label lives on the tail root, so a recreated pill button inherits it without re-decoration.
- Before any successful compaction, the default footer is `R/I/O` only (Session usage). After one or more successful compactions, it is `Session: R/I/O | Window: R/I/O`. Value order is cache read / uncached input / output. The UI uses `statusbarWindowUsage.compactionCount` to distinguish these states; an absent projection is unknown, not zero. Custom templates are never overridden.
- When Window projection is absent, show an explicit `—` placeholder. Persisted old default templates are normalized without changing unrelated user preferences.
- Session and Window exact counts are exposed in the click dialog; Window is titled “Current window usage” / “当前窗口用量”, but remains cumulative billed usage of the active compaction epoch.
- The ContextMeter visible label uses DSH's `contextPressure` and a separate scoped CSS override; it is **not** the Window accumulated usage.
- Replacing the whole `conversation.chat.node` `turn-tail` renderer would shadow shipped copy/branch/feedback/clock and both child Slots (`replaceRisk: shadows-shipped-ui`); that is why the per-Turn label uses the scoped override instead.

## Builds and validation

```bash
pnpm install --frozen-lockfile
pnpm check
```

The Git plugin installer runs checked-in `lib/index.js` and `lib/client.js`. Rebuild both with the same source changes (`pnpm build` also regenerates the source maps) and commit them together.
