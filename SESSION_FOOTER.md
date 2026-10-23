# Session footer scope

- Official `conversation.composer.dock` slot: override only `id: usage`, `order: 1`, `priority: -1`. Native `activity` and all per-Turn usage and actions remain unchanged.
- Read whole-session `tokenUsage` projection, never sum visible message tokens.
- Template variables separately expose `cacheReadTokens`, `uncachedInputTokens`, `cacheWriteTokens`, `outputTokens`, total input and combined total.
- The custom usage pill has a simple local exact-count dialog. A theme that clips overflow might require positioning changes.
- Native ContextMeter has no replaceable Slot; its visible percent uses scoped CSS with `contextPressure.projectedTokens ?? pressureTokens` over `contextWindow`. The ring, native popup, tooltip and accessibility percent are retained.
- Values are estimates for next-request context; do not conflate them with billed session totals.
- Source includes Vitest usage tests. Prebuilt bundles in `lib/` are necessary for Git installation. Current source maps are intentionally minimal valid no-mapping placeholders; rebuilding with `pnpm check` regenerates accurate maps.
