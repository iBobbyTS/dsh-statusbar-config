import { describe, expect, it } from 'vitest'
import { billedInputTokens, contextMeterReading, renderTemplate } from '../src/client/stats.js'
import type { TokenUsageProjection } from '../src/client/types.js'
const usage: TokenUsageProjection = {
  uncachedInputTokens: 500_000, cacheReadTokens: 51_300_000, cacheWriteTokens: 20_000, outputTokens: 120_000,
}
describe('session usage footer', () => {
  it('keeps the input buckets separate', () => {
    expect(renderTemplate('↩ ${cacheRead} · ↓ ${uncachedInput} · ↑ ${output}', undefined, usage))
      .toBe('↩ 51.3M · ↓ 500K · ↑ 120K')
    expect(renderTemplate('${cacheWrite} / ${input} / ${total}', undefined, usage))
      .toBe('20K / 51.8M / 51.9M')
    expect(billedInputTokens(usage)).toBe(51_820_000)
  })
  it('uses the projected context after compaction', () => {
    expect(contextMeterReading({ projectedTokens: 38_400, pressureTokens: 100_000, contextWindow: 200_000 }))
      .toBe('38.4K / 200K')
  })
  it('falls back and avoids fabricated counts', () => {
    expect(contextMeterReading({ pressureTokens: 30_000, contextWindow: 200_000 })).toBe('30K / 200K')
    expect(contextMeterReading(undefined)).toBeNull()
    expect(contextMeterReading({ contextWindow: 200_000 })).toBeNull()
    expect(contextMeterReading({ projectedTokens: 1_000, contextWindow: 0 })).toBeNull()
  })
})
