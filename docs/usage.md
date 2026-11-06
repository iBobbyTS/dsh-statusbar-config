# Usage display, accounting and integration

## Accounting and ownership

- Session totals come from native `tokenUsage`; the plugin does not recompute that total.
- `statusbarWindowUsage` folds the same provider samples into disjoint cache-read, uncached-input, cache-write and output buckets. Authoritative `assistant/message.data.usage` wins over stream usage; the last packed usage chunk is used; repeated same-step samples replace one another until `llm/retry-started` closes that scope.
- A Window begins at session creation and restarts after a successful `compaction/end`. Start, summary, prune, failed and interrupted compactions do not reset it. Summarizer-only usage is excluded from Session and Window totals.
- Turn labels prefer the native Turn-tail buckets. When cache reads are absent, `statusbarTurnUsage` supplies per-Turn sums with omitted buckets contributing zero. Without either accounting source the native label remains.
- Projections are replayable and checkpointed by DSH. The browser owns display decorations only, scoped to the owning Turn or Conversation, and removes them on cleanup or when matching evidence disappears. It never searches another conversation for a matching Turn number or compaction count pair.

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
- Values prefer that Turn's `turn-tail` Chat node `tokenUsage` (cache read / uncached input / output).
- DSH hides the whole cache-read bucket once any attempt in the Turn omitted it. In that case the pill falls back to the plugin's own `statusbarTurnUsage` session projection, which re-sums the same `assistant/message` / `assistant/attempt` events **with an omitted bucket counting as zero**, so a single omitted attempt no longer returns the Turn to the native total. For example, a Turn whose first 19.8K-input call carried no cache field and whose later 22 calls read 684K from cache shows `684K/47.4K/9.3K`.
- A provider that never reports cache reads likewise shows an explicit zero (e.g. `0/8.2K/31`); only a Turn with no billed usage at all keeps DSH's native `Usage x tok`.
- Implementation: The checked DSH 0.2.2-rc.1 renderer exposes no dedicated per-Turn usage Slot — the pill is built inside `TurnTailNodeView`. The plugin registers a hidden-anchor `conversation.chat.turnTail` entry that publishes the Turn's counters on the Turn-tail root, and a scoped CSS override hides the shipped text and renders the three counters. Replacing the whole `turn-tail` renderer (`shadows-shipped-ui`) would re-own copy/branch/feedback/clock, so it is not used.

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
- The values come from `compaction/summary`'s `usage`. The shipped Chat node keeps only the replaced-history item and token counts and drops that field, so the `statusbarCompactionUsage` Host projection preserves it and matches each rendered marker by the two counts the marker still prints, only when that pair is unique within the owning Conversation. Ambiguous matches retain the native text.
- Only that summary text is replaced: the context icon, the hover disclosure arrow, the expandable Markdown summary and the pinned header all stay native.
- A marker whose summarization usage was not reported, or that shows a fallback string, keeps the shipped text.
- The row can also mount *after* the projection arrives (restored session, scrolled-back history, a row the transcript re-creates), so the plugin watches the transcript's DOM instead of patching once on a timer: a late row is labelled as soon as it appears, including when its text is filled in a later update.
- Summarizer calls were never part of the Session `tokenUsage` or the Window epoch; this only displays them on the marker and changes no running total.

## Compaction row

Together with [`@local/dsh-fork-after-compaction`](https://github.com/iBobbyTS/dsh-fork-after-compaction), the action row under each compaction marker is formatted by this plugin too:

- The row mirrors the shipped completed-Turn action row (copy / branch / usage / clock, without the feedback thumbs); its branch forks at that compaction's end.
- The row owns its database glyph and the three counters; this plugin reads the raw buckets the row publishes and rewrites the text with the same formatter as the Turn pill, so both placements stay identical.
- The producer owns the [row integration contract](https://github.com/iBobbyTS/dsh-fork-after-compaction/blob/main/docs/DEVELOPMENT.md#dsh-statusbar-config-integration). This plugin scans its owning Conversation on mount and listens for the producer's row-mount notification, then formats the exposed buckets. Without this plugin the row retains its fallback label and still forks.
- Only the text is replaced: the glyph and the narrow-viewport icon-only collapse stay with the row.


## Development

```bash
pnpm install --frozen-lockfile
pnpm check
```

The Git plugin installer loads checked-in `lib/index.js` and `lib/client.js`; `pnpm build` also refreshes their source maps. Source and generated entrypoints are delivered together.

The configuration page is projected by dsh's settings service from the Host `Config` schema: only fields marked `.volatile()` reach `settings/describe`. Without the flag the whole namespace is unavailable and the template editor renders “settings namespace unavailable” with every control disabled. Saved values land in the profile's `cordis.patch.yml`, and the Loader re-applies this plugin with the new config.


## Validation scope

Source contracts and automated checks targeted DSH `0.2.2-rc.1`. They do not establish a real Desktop UI acceptance result.
