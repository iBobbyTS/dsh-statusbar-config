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

## Compaction marker

A landed compaction marker used to print the estimated size of the replaced history:

```text
Compacted 709 history items (~413235 tokens)
```

It now labels that row with the summarization call's own usage:

```text
173K→2.4K tokens
```

- The left side is **all prompt input summed** (uncached input + cache read + cache write); the right side is the summary output, in the same K/M units as the composer footer.
- The values come from `compaction/summary`'s `usage`. The shipped Chat node keeps only the replaced-history item and token counts and drops that field, so the `statusbarCompactionUsage` Host projection preserves it and matches each rendered marker by the two counts the marker still prints.
- Only that summary text is replaced: the context icon, the hover disclosure arrow, the expandable Markdown summary and the pinned header all stay native.
- A marker whose summarization usage was not reported, or that shows a fallback string, keeps the shipped text.
- The row can also mount *after* the projection arrives (restored session, scrolled-back history, a row the transcript re-creates), so the plugin watches the transcript's DOM instead of patching once on a timer: a late row is labelled as soon as it appears, including when its text is filled in a later update.
- Summarizer calls were never part of the Session `tokenUsage` or the Window epoch; this only displays them on the marker and changes no running total.

## Compaction row

Together with [`@local/dsh-fork-after-compaction`](../dsh-fork-after-compaction), the action row under each compaction marker is formatted by this plugin too:

- The row mirrors the shipped completed-Turn action row (copy / branch / usage / clock, without the feedback thumbs); its branch forks at that compaction's end.
- The row owns its database glyph and the three counters; this plugin reads the raw buckets the row publishes and rewrites the text with the same formatter as the Turn pill, so both placements stay identical.
- Integration contract: the row carries `data-dfac-usage` plus `data-dfac-cache-read` / `data-dfac-uncached-input` / `data-dfac-output` on its usage pill and dispatches a bubbling `dsh-fork-row-usage` event on mount; this plugin scans once on mount and listens for that event. Without this plugin the row shows its own fallback label and still forks.
- Only the text is replaced: the glyph and the narrow-viewport icon-only collapse stay with the row.


## Development

```bash
pnpm install --frozen-lockfile
pnpm check
```

Keep checked-in `lib/` (Host and Client) synchronized with `src/` for no-build Git plugin installation. See [SESSION_FOOTER.md](SESSION_FOOTER.md).

The configuration page is projected by dsh's settings service from the Host `Config` schema: only fields marked `.volatile()` reach `settings/describe`. Without the flag the whole namespace is unavailable and the template editor renders “settings namespace unavailable” with every control disabled. Saved values land in the profile's `cordis.patch.yml`, and the Loader re-applies this plugin with the new config.

MIT license; original author MannixHu.
