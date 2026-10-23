import { describe, expect, it } from 'vitest'
import { renderTemplate } from '../src/client/stats.js'
import type { TokenUsageProjection, WindowUsageProjection } from '../src/client/types.js'

const session: TokenUsageProjection = { cacheReadTokens: 70_000_000,
  uncachedInputTokens: 1_000_000, cacheWriteTokens: 0, outputTokens: 130_000 }
const window: WindowUsageProjection = { cacheReadTokens: 10_000_000,
  uncachedInputTokens: 200_000, cacheWriteTokens: 0, outputTokens: 30_000, compactionCount: 1 }
const format = "Session: ${cacheRead}/${uncachedInput}/${output} | Window: ${windowCacheRead}/${windowUncachedInput}/${windowOutput}"

describe('Session and Window footer', () => {
  it('renders the two independent accounting intervals', () => {
    expect(renderTemplate(format, undefined, session, window)).toBe(
      'Session: 70M/1M/130K | Window: 10M/200K/30K',
    )
  })
  it('shows unavailable Window instead of repeating Session counts', () => {
    expect(renderTemplate(format, undefined, session)).toContain('Window: —/—/—')
  })
})
