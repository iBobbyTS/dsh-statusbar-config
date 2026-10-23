# dsh-statusbar-config — Session / Window footer fork

[中文](README.md) · [Original MannixHu/dsh-statusbar-config](https://github.com/MannixHu/dsh-statusbar-config) · MIT

This fork replaces only the **Session usage** item through DSH's official `conversation.composer.dock` / `usage` Slot. Native `activity` (turns, steps, throughput) and all completed-Turn usage controls are unchanged.

Default:

```text
↩ /↑/↓ | Session: 70M/1M/130K | Window: 10M/200K/30K
```

The three values in each group are cache-read input / uncached input / output tokens.

- **Session**: DSH's authoritative cumulative `tokenUsage` projection for the complete durable session.
- **Window**: All model usage **since the most recent successful compaction**, across multiple Turns. This is a billing interval, not the current live prompt occupancy.
- An unsuccessful compaction does not reset the Window. Before the first successful compaction, Window is accumulated from session start. Subsequent successful `compaction/end` events start a new epoch.
- The `statusbarWindowUsage` Host Session Projection replays durable events and obeys the same replacement/retry semantics as native `tokenUsage`. It supports historic Session replay and registry checkpoints.
- Compaction summarizer-only model calls are not included (matching the native Session `tokenUsage` accounting).

## Install

```bash
dsh plugin --profile desktop add github:iBobbyTS/dsh-statusbar-config
```

Use `--profile web` for the browser profile. Restart DSH after installation so the Host projection registers. The prebuilt `lib/` bundle is included.

## Templates

Configure via **Settings → Plugins → Status bar template**:

```text
↩ /↑/↓ | Session: ${cacheRead}/${uncachedInput}/${output} | Window: ${windowCacheRead}/${windowUncachedInput}/${windowOutput}
```

| Variable | Meaning |
|---|---|
| `${cacheRead}` / `${uncachedInput}` / `${output}` | Session cache reads / uncached input / output |
| `${windowCacheRead}` / `${windowUncachedInput}` / `${windowOutput}` | Window cache reads / uncached input / output |
| `${cacheWrite}` / `${windowCacheWrite}` | Cache-write input in each interval |
| `${input}` / `${total}` | Session total input / combined tokens |
| `${windowTotal}` | Window combined tokens |
| `${cache}` | Session cache-hit percent |
| `${turns}` / `${steps}` / `${ttft}` / `${tps}` | Turn/step counts, first-token latency, decode speed |

Existing users with the previous **default** are migrated automatically at render time; unrelated custom templates remain unchanged. If the Host Window projection has not arrived, the Window values show `—` rather than duplicating Session totals.

Click the session pill for exact count details for both intervals, including nonzero cache writes.

## Context occupancy

The separate native ContextMeter continues to show `used / capacity` instead of percent as a visible label. This uses `contextPressure` and is independent of the post-compaction billed totals. Native ring and dialog remain intact; since DSH has no ContextMeter Slot, the visible label uses a scoped CSS compatibility override.

## Development

```bash
pnpm install --frozen-lockfile
pnpm check
```

Keep checked-in `lib/` (Host and Client) synchronized with `src/` for no-build Git plugin installation. See [SESSION_FOOTER.md](SESSION_FOOTER.md).

MIT license; original author MannixHu.
