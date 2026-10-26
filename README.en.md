# dsh-statusbar-config — Session / Window footer fork

[中文](README.md) · [Original MannixHu/dsh-statusbar-config](https://github.com/MannixHu/dsh-statusbar-config) · MIT

This fork replaces the **Session usage** item through DSH's official `conversation.composer.dock` / `usage` Slot, and shows the completed-Turn usage pill as the same `cache-read/uncached-input/output` counters. Native `activity` (turns, steps, throughput) is unchanged, and the Turn pill keeps its shipped position, icon, click-open dialog and narrow-viewport collapse.

Default footer automatically adapts to compaction history:

```text
Never compacted: 70M/1M/130K
Compacted: Session: 70M/1M/130K | Window: 10M/200K/30K
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
Session: ${cacheRead}/${uncachedInput}/${output} | Window: ${windowCacheRead}/${windowUncachedInput}/${windowOutput}
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

Click the session pill for exact count details for both intervals, including nonzero cache writes. The dialog labels the second group “Current window usage”; it still means cumulative billing since the latest successful compaction, not instantaneous ContextMeter occupancy.

## Context occupancy

The separate native ContextMeter continues to show `used / capacity` instead of percent as a visible label. This uses `contextPressure` and is independent of the post-compaction billed totals. Native ring and dialog remain intact; since DSH has no ContextMeter Slot, the visible label uses a scoped CSS compatibility override.

## Turn usage

Each completed Turn's usage pill shows that Turn's own counters, in the same order as the composer footer:

```text
9.2M/96.1K/56.1K
```

- Always on; there is no separate toggle. The database icon, hover background, the native “Turn usage” click dialog (exact integers, cache-hit percent, provider/model) and the shipped icon-only collapse below 480px all stay.
- It always uses this compact three-counter form and ignores the custom template above.
- Values come from that Turn's `turn-tail` Chat node `tokenUsage` (cache read / uncached input / output); no billing is recomputed.
- When the provider never reported cache reads, the pill keeps DSH's native `Usage x tok` instead of inventing a `0`.
- Implementation: dsh 0.2.1 exposes no per-Turn usage Slot — the pill is built inside `TurnTailNodeView`. The plugin registers a **null-rendering** `conversation.chat.turnTail` entry that publishes the Turn's counters on the Turn-tail root, and a scoped CSS override hides the shipped text and renders the three counters. Replacing the whole `turn-tail` renderer (`shadows-shipped-ui`) would re-own copy/branch/feedback/clock, so it is not used.

## Development

```bash
pnpm install --frozen-lockfile
pnpm check
```

Keep checked-in `lib/` (Host and Client) synchronized with `src/` for no-build Git plugin installation. See [SESSION_FOOTER.md](SESSION_FOOTER.md).

MIT license; original author MannixHu.
