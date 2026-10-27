import { describe, expect, it } from 'vitest'
import {
  compactionUsageProjectionDefinition, foldCompactionUsage, initialCompactionUsage,
} from '../src/compaction-usage.js'

const usage = (inputTokens: number, outputTokens: number, cacheReadTokens = 0, cacheWriteTokens = 0) =>
  ({ inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens })
const summary = (seq: number, items: number, tokens: number, reported?: ReturnType<typeof usage>) => ({
  type: 'compaction/summary',
  seq,
  data: {
    compactionId: `c${String(seq)}`,
    summary: [{ type: 'text', text: '## summary' }],
    shadowedSeqs: Array.from({ length: items }, (_, index) => index + 1),
    shadowedTokenCount: tokens,
    ...reported === undefined ? {} : { usage: reported },
  },
})
const replay = (...events: unknown[]) => events.reduce(foldCompactionUsage, initialCompactionUsage())

describe('compaction usage projection', () => {
  it('keeps the summarizer usage next to the printed history counts', () => {
    const result = replay(summary(7, 709, 413_235, usage(1_200, 4_096, 172_800)))
    expect(result.entries).toEqual([{
      seq: 7,
      items: 709,
      tokens: 413_235,
      inputTokens: 174_000,
      outputTokens: 4_096,
    }])
    expect(compactionUsageProjectionDefinition.wire.viewSchema.parse(result.entries)).toEqual(result.entries)
  })

  it('sums every prompt-side bucket into the input total', () => {
    const result = replay(summary(3, 2, 900, usage(383, 2_449, 172_928, 128)))
    expect(result.entries[0]).toMatchObject({ inputTokens: 383 + 172_928 + 128, outputTokens: 2_449 })
  })

  it('ignores a summary whose usage or counts were not reported', () => {
    expect(replay(summary(1, 5, 500)).entries).toEqual([])
    expect(replay({ type: 'compaction/summary', seq: 2, data: { usage: usage(1, 2) } }).entries).toEqual([])
    expect(replay({
      type: 'compaction/summary', seq: 3, data: { shadowedSeqs: 'nope', shadowedTokenCount: 5, usage: usage(1, 2) },
    }).entries).toEqual([])
  })

  it('ignores unrelated events and keeps the same state reference', () => {
    const state = initialCompactionUsage()
    expect(foldCompactionUsage(state, { type: 'turn/start', seq: 1 })).toBe(state)
    expect(foldCompactionUsage(state, { type: 'compaction/end', seq: 2, data: {} })).toBe(state)
  })

  it('is idempotent across replay of the same summary event', () => {
    const event = summary(9, 4, 400, usage(10, 20))
    const result = replay(event, event)
    expect(result.entries).toHaveLength(1)
  })
})
