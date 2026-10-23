import { describe, expect, it } from 'vitest'
import { renderTemplate, selectFooterTemplate } from '../src/client/stats.js'
import { DEFAULT_SETTINGS, resolveUsageTemplate } from '../src/settings.js'
import type { TokenUsageProjection, WindowUsageProjection } from '../src/client/types.js'

const session: TokenUsageProjection = { cacheReadTokens: 70_000_000,
  uncachedInputTokens: 1_000_000, cacheWriteTokens: 0, outputTokens: 130_000 }
const window: WindowUsageProjection = { cacheReadTokens: 10_000_000,
  uncachedInputTokens: 200_000, cacheWriteTokens: 0, outputTokens: 30_000, compactionCount: 1 }
const format = "Session: ${cacheRead}/${uncachedInput}/${output} | Window: ${windowCacheRead}/${windowUncachedInput}/${windowOutput}"

describe('Session and Window footer', () => {
  it('shows only three Session counters before the first successful compaction', () => {
    const beforeCompaction: WindowUsageProjection = {
      ...session, compactionCount: 0,
    }
    const template = selectFooterTemplate(DEFAULT_SETTINGS.template, beforeCompaction)
    expect(renderTemplate(template, undefined, session, beforeCompaction)).toBe('70M/1M/130K')
    expect(template).toBe('${cacheRead}/${uncachedInput}/${output}')
  })
  it('keeps the full two-interval footer after the first successful compaction', () => {
    const template = selectFooterTemplate(DEFAULT_SETTINGS.template, window)
    expect(renderTemplate(template, undefined, session, window)).toBe(
      'Session: 70M/1M/130K | Window: 10M/200K/30K',
    )
  })
  it('applies the condition to migrated legacy defaults', () => {
    const migrated = resolveUsageTemplate('↩ /↑/↓ | Session: ${cacheRead}/${uncachedInput}/${output} | Window: ${windowCacheRead}/${windowUncachedInput}/${windowOutput}')
    expect(selectFooterTemplate(migrated, { ...session, compactionCount: 0 })).toBe(
      '${cacheRead}/${uncachedInput}/${output}',
    )
  })
  it('does not override custom templates or mistake missing projection for no compaction', () => {
    const beforeCompaction: WindowUsageProjection = { ...session, compactionCount: 0 }
    const custom = 'MY TOKEN: ${cacheRead}/${output}'
    expect(selectFooterTemplate(custom, beforeCompaction)).toBe(custom)
    expect(selectFooterTemplate(DEFAULT_SETTINGS.template, undefined)).toBe(DEFAULT_SETTINGS.template)
    expect(renderTemplate(selectFooterTemplate(DEFAULT_SETTINGS.template, undefined), undefined, session))
      .toContain('Window: —/—/—')
  })
  it('renders the two independent accounting intervals', () => {
    expect(renderTemplate(format, undefined, session, window)).toBe(
      'Session: 70M/1M/130K | Window: 10M/200K/30K',
    )
  })
  it('shows unavailable Window instead of repeating Session counts', () => {
    expect(renderTemplate(format, undefined, session)).toContain('Window: —/—/—')
  })
})
