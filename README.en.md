# dsh-statusbar-config

[中文](README.md) · [Upstream MannixHu/dsh-statusbar-config](https://github.com/MannixHu/dsh-statusbar-config) · MIT

This fork displays cache-read / uncached-input / output counters while retaining DSH's native controls and detail dialogs.

- Before compaction, show Session totals; after successful compaction, also show cumulative Window usage since that compaction.
- Turn tails display their own counters; compaction markers can display summarizer input and output.
- ContextMeter shows used / capacity, independently of Window billing.
- Missing accounting or ambiguous compaction matches retain native display. Decorations stay within their owning conversation.

## Compatibility

Verified: DSH 0.2.2-rc.1 (source review and automated checks); Desktop testing has not been completed.

## Install

Install this fork:

```sh
dsh plugin --profile desktop add github:iBobbyTS/dsh-statusbar-config
```

For Desktop, launch it once, quit it, and use its bundled CLI. Use `--profile web` for the browser profile. Restart the target Host and refresh its client after installation or updates. Checked-in `lib/` entrypoints require no install-time build.

## Usage and documentation

Edit the template in **Settings → Plugins → Status bar template**. Counters default to cache reads / uncached input / output; click a usage pill for exact counts. Window is cumulative billing since compaction, not current context occupancy.

The [detailed guide](docs/usage.md) covers template variables, accounting, fallbacks, compaction markers, plugin integration and development commands.

Original author MannixHu; the fork retains the MIT license and attribution.
