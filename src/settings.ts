/**
 * Shared settings contract between the Host half (namespace registration)
 * and the browser half (scope binding + card).
 *
 * The namespace deliberately reuses the historical `status-bar-config` value
 * so pre-template sections in `~/.dsh/settings.yaml` keep loading (unknown
 * legacy keys are ignored).
 */
export const SETTINGS_NAMESPACE_VALUE = 'status-bar-config'
export const PREVIOUS_DEFAULT_TEMPLATE = "↩ ${cacheRead} · ↑ ${uncachedInput} · ↓ ${output}"
/** Saved defaults from version 0.3.0 (and a spacing variant). */
export const LEGACY_DUAL_DEFAULT_TEMPLATE = "↩ /↑/↓ | Session: ${cacheRead}/${uncachedInput}/${output} | Window: ${windowCacheRead}/${windowUncachedInput}/${windowOutput}"
export const SPACED_DUAL_DEFAULT_TEMPLATE = "↩ / ↑ / ↓ | Session: ${cacheRead}/${uncachedInput}/${output} | Window: ${windowCacheRead}/${windowUncachedInput}/${windowOutput}"

export interface StatusbarSettings {
  enabled: boolean
  /** Display template using `${variable}` placeholders; empty = default row. */
  template: string
}

export const DEFAULT_SETTINGS: Readonly<StatusbarSettings> = Object.freeze({
  enabled: true,
  template: "Session: ${cacheRead}/${uncachedInput}/${output} | Window: ${windowCacheRead}/${windowUncachedInput}/${windowOutput}",
})

/** Upgrade the shipped default without overwriting unrelated custom templates. */
export function resolveUsageTemplate(template: string): string {
  const value = template.trim()
  return value === PREVIOUS_DEFAULT_TEMPLATE
    || value === LEGACY_DUAL_DEFAULT_TEMPLATE
    || value === SPACED_DUAL_DEFAULT_TEMPLATE
    ? DEFAULT_SETTINGS.template : template
}

/**
 * Narrow one wire section to the exact settings shape; undefined rejects the
 * section so the consumer falls back to defaults. Unknown keys (legacy toggle
 * names from pre-template versions) are ignored; a missing `template`
 * resolves to its default.
 */
export function decodeSettings(value: unknown): StatusbarSettings | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined
  const record = value as Record<string, unknown>
  if (typeof record.enabled !== 'boolean') return undefined
  if (record.template !== undefined && typeof record.template !== 'string') return undefined
  return {
    enabled: record.enabled,
    template: typeof record.template === 'string' ? resolveUsageTemplate(record.template) : DEFAULT_SETTINGS.template,
  }
}
