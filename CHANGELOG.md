# Changelog

## 0.3.4 (2026-10-26, iBobbyTS fork)

- Re-open the Plugins-page template editor: the Host `Config` now marks `enabled` and `template` volatile. dsh 0.1.7+ projects only volatile fields into a settings namespace, so without the flag `dsh-statusbar-config` was absent from `settings/describe` altogether — the card reported “settings namespace unavailable” and kept the input, the variable chips and the reset button disabled.
- Drop the obsolete `settings.register(...)` call from the Host half: dsh derives the form from the exported `Config` schema and writes into the profile patch, and that method no longer exists.
- Remove the vestigial `status-bar-config` namespace constant and pin the schema contract (volatile flags, shipped defaults, textarea role) with a regression test.
- Bump `@deepseek-ai/schemastery` to 3.18.5, the dsh fork that provides `.volatile()`.

## 0.3.3 (2026-10-26, iBobbyTS fork)

- Show each completed Turn's usage pill as `缓存读取/未缓存输入/输出` (e.g. `9.2M/96.1K/56.1K`), matching the composer footer; the shipped icon, hover, click-open “Turn usage” dialog and the <480px icon-only collapse are reused.
- Publish the label from a null-rendering `conversation.chat.turnTail` entry and rewrite the shipped text with a scoped CSS override, because dsh 0.2.1 exposes no per-Turn usage Slot and replacing the whole `turn-tail` renderer would re-own copy/branch/feedback/clock. The label is always on; a provider that never reports cache reads keeps the native `usage x tok`.
- Add per-Turn label tests and rebuild the checked-in Client bundle.
- Repair the checked-in source so `pnpm typecheck`/`pnpm build` pass again: the usage dialog's Window block was missing its closing brace, and the stylesheet comment contained backticks that terminated the CSS template literal.

## 0.3.2 (2026-10-23, iBobbyTS fork)

- Rename the usage popup's “post-compaction window cumulative usage” heading to “Current window usage” / “当前窗口用量”.
- Hide the Session and Window labels/duplicate Window values in the default footer until the first successful compaction; show only the Session R/I/O counters.
- Preserve the two-interval footer after compaction, custom templates, and unknown-Window fallback.
- Synchronize the checked-in Client bundle and regression tests.

## 0.3.1 (2026-10-23, iBobbyTS fork)

- Remove the leading `↩ /↑/↓ | ` legend from the Session / Window usage footer.
- Migrate saved former default templates (including the spaced legend) without changing custom templates.
- Supply localized Plugin Manager display metadata titled **Statusbar Enhancement**.
- Keep npm package, Cordis plugin and persisted settings identifiers unchanged.
- Synchronize prebuilt Host/Client bundles and update tests/documentation.

## 0.3.0 (2026-10-23, iBobbyTS fork)

- Add Host Session Projection for cumulative Window usage since the last successful compaction.
- Preserve native lifetime Session totals; cover all Turns, retries and historical replay.
- Change footer to `↩ /↑/↓ | Session: R/I/O | Window: R/I/O`.
- Add Window detail rows, template placeholders, migration of the prior default, tests and prebuilt bundles.

## 0.2.3 (2026-10-23, iBobbyTS fork)

- Replace native session `usage` via DSH Slot, keeping activity and per-Turn usage unchanged.
- Display cache-read, uncached input, cache-write and output buckets separately.
- Show approximate context used/capacity via a scoped CSS override, retaining the native context ring and popup.
- Add session usage details and tests.

## 0.2.2 (2026-09-29)

- Adapt to DSH 0.1.7+: the client settings service moved from `settingsScope`
  to `configForms`, so the plugin now reads and writes its config through
  `configForms.get('dsh-statusbar-config')` (the Loader entry id). On 0.2
  Desktop the old inject left the entry pending and failed the whole web boot
- The settings card moves from the removed `settings.plugin.item` slot to this
  bundle's page in the Plugins section (`plugins.bundle.config`)
- Values now live in the `dsh-statusbar-config` entry config; the legacy
  `status-bar-config` section in `settings.yaml` is no longer read
- Declare `engines.dsh: >=0.1.7-0` so the plugin market can show and check the
  host requirement

## 0.2.1 (2026-09-03)

- Variable chips show a bilingual hover tooltip describing each `${variable}`
  (what it measures, format, example value); also exposed via `aria-label`
- Tooltip opens below the chip, aligns to its left edge, and is clamped inside
  the settings card so it never clips at either dialog edge
- Release tarball is attached with a version-less filename
  (`dsh-statusbar-config.tgz`) so `releases/latest/download/` links stay stable

## 0.2.0 (2026-09-02)

Template-driven status bar. The 0.1 per-segment toggles are superseded by a
single display template using JS template-literal syntax.

- `${variable}` placeholders: `${ttft}` `${tps}` `${cache}` `${input}`
  `${output}` `${turns}` `${steps}` `${llm}` `${tool}`; units and literals live
  in the template; unknown placeholders stay verbatim; no-data variables
  render empty
- Empty template = default official-style segments; `enabled: false` hides
  the row; the row is hidden before any step or token exists (official parity)
- Settings card: enabled toggle + template input with click-to-insert variable
  chips, Enter/blur save, bilingual guided hints
- Same settings namespace `status-bar-config`; legacy boolean keys in
  `settings.yaml` are ignored on load — migrate by writing `template:` instead

## 0.1.0 (2026-09-02)

Initial release. Shadows the shipped `conversation.composer.dock` `stats`
entry (priority -1) with a toggle-filtered StatsLine using the same data and
formatting as the official row; settings namespace registered on the host and
editable in Settings → Plugins.
