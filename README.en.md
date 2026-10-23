# dsh-statusbar-config — Session footer fork

[中文](README.md) · [Original MannixHu/dsh-statusbar-config](https://github.com/MannixHu/dsh-statusbar-config) · MIT

This fork replaces only the **session-level usage pill** beneath the composer via DSH's native `conversation.composer.dock` / `usage` Slot. The native turns, steps and token speed, and every per-Turn usage row remain unchanged.

Example: `↩ 51.3M · ↓ 500K · ↑ 120K` (cache reads, uncached input and output).

## Install

```bash
dsh plugin --profile desktop add github:iBobbyTS/dsh-statusbar-config
```

Use `--profile web` for the browser profile. Restart DSH after installation. The repository includes prebuilt `lib/` artifacts.

## Configure

Open **Settings → Plugins → Status bar template**. Default:

```text
↩ ${cacheRead} · ↓ ${uncachedInput} · ↑ ${output}
```

| Variable | Meaning |
|---|---|
| `${cacheRead}` | Cached prompt input |
| `${uncachedInput}` | Uncached prompt input |
| `${cacheWrite}` | Cache writes |
| `${output}` | Output tokens (including reasoning) |
| `${input}` | Total input including cache reads and writes |
| `${total}` | All input plus output |
| `${cache}` | Cache hit percent without % |
| `${turns}` / `${steps}` | Turns and steps |
| `${ttft}` / `${tps}` | Average TTFT seconds and token/s |
| `${llm}` / `${tool}` | Model/tool wall time |

An empty template shows session total and cache hit; unknown variables remain visible. Clicking the custom usage pill opens exact usage counts.

## Context

The native percent's visible text is overlaid with an approximate `≈used / capacity` reading, using `contextPressure.projectedTokens` (fallback `pressureTokens`) and `contextWindow`. This is **not cumulative session usage**. Its native ring, popup, tooltip and percentage-based accessibility label remain intact.

DSH has no dedicated ContextMeter replacement Slot, so the context label uses a scoped CSS override that may need updating with newer DSH DOM versions.

## Develop

```bash
pnpm install --frozen-lockfile
pnpm check
```

Keep prebuilt `lib/` synchronized with `src/`. Current source maps are valid no-mapping placeholders; rebuilding generates mapped versions. See [SESSION_FOOTER.md](SESSION_FOOTER.md).

MIT license; original author MannixHu.
