# dsh-statusbar-config development

This fork changes usage presentation and supplies missing usage projections. It does not replace native Chat actions, dialogs or billing authority.

- [Usage and accounting](docs/usage.md) owns counter meanings, fallback behavior and integration contracts. Keep Session, Window, Turn and context-occupancy meanings distinct.
- Keep DOM decorators inside the owning Conversation or Turn. Unresolved scope, ambiguous matches and missing data must preserve native output; cleanup releases only this plugin's decorations.
- Use native extension slots and retain native controls. Host projections own accounting; browser code owns presentation. Settings fields intended for the projected editor need the Host schema's `.volatile()` exposure.
- Keep both README languages aligned. Commit changed `src/` with rebuilt `lib/` entrypoints and maps; Git installs consume those artifacts.
- Run `pnpm check` for affected implementation changes. Validate version-sensitive seams against the intended DSH release and distinguish automated/source checks from Desktop UI acceptance.

[README](README.md) owns installation and the human entry. Detailed data and display contracts have one owner in `docs/usage.md`.

开发、构建与交付遵循父目录 [统一规范](../docs/plugin-development.md)。`src/` 是编辑源，`lib/` 由显式构建生成并与源码一同交付。
