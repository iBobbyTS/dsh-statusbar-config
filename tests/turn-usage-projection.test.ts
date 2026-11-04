import { describe, expect, it } from 'vitest'
import { foldTurnUsage, initialTurnUsage, turnUsageProjectionDefinition } from '../src/turn-usage.js'

const u = (cacheReadTokens: number, inputTokens: number, outputTokens: number, cacheWriteTokens = 0) =>
  ({ cacheReadTokens, inputTokens, outputTokens, cacheWriteTokens })
const message = (turn: number, step: number, usage: Record<string, number>) =>
  ({ type: 'assistant/message', data: { turn, step, usage, stream: [] } })
const attempt = (turn: number, step: number, usage: Record<string, number>) =>
  ({ type: 'assistant/attempt', data: { turn, step, stream: [
    { type: 'chunk', time: 1, chunk: { type: 'usage', usage } },
  ] } })
const end = (compactionId: string) => ({ type: 'compaction/end', data: { compactionId, turn: null } })
const replay = (...events: unknown[]) => events.reduce(foldTurnUsage, initialTurnUsage())

describe('Turn usage projection', () => {
  it('sums a Turn whose first attempt omitted the cache-read bucket as zero', () => {
    // session-6d1d044e shape: the session's first request reports no cache
    // buckets at all, and DSH therefore hides the Turn's whole cache-read split.
    const result = replay(
      message(1, 1, { inputTokens: 19_786, outputTokens: 211 }),
      message(1, 2, u(19_776, 1_581, 402)),
    )
    expect(result.entries).toEqual([{
      turn: 1, uncachedInputTokens: 21_367, cacheReadTokens: 19_776, cacheWriteTokens: 0, outputTokens: 613,
    }])
    expect(turnUsageProjectionDefinition.wire.viewSchema.parse(result.entries)).toEqual(result.entries)
  })

  it('keeps every Turn separate and survives compaction boundaries', () => {
    const result = replay(
      message(1, 1, u(100, 10, 5)),
      end('c1'),
      message(2, 1, u(200, 20, 10)),
    )
    expect(result.entries).toEqual([
      { turn: 1, uncachedInputTokens: 10, cacheReadTokens: 100, cacheWriteTokens: 0, outputTokens: 5 },
      { turn: 2, uncachedInputTokens: 20, cacheReadTokens: 200, cacheWriteTokens: 0, outputTokens: 10 },
    ])
  })

  it('replaces a same-step stream sample by the final message usage', () => {
    const result = replay(attempt(1, 1, u(300, 20, 10)), message(1, 1, u(350, 20, 15)))
    expect(result.entries).toEqual([{
      turn: 1, uncachedInputTokens: 20, cacheReadTokens: 350, cacheWriteTokens: 0, outputTokens: 15,
    }])
  })

  it('adds separately billed retries to the same Turn', () => {
    const result = replay(
      attempt(1, 1, u(300, 20, 10)),
      { type: 'llm/retry-started', data: { turn: 1, step: 1 } },
      message(1, 1, u(350, 30, 15)),
    )
    expect(result.entries).toEqual([{
      turn: 1, uncachedInputTokens: 50, cacheReadTokens: 650, cacheWriteTokens: 0, outputTokens: 25,
    }])
  })

  it('is idempotent across replay of the same committed usage', () => {
    const event = message(1, 1, u(100, 10, 5))
    const once = replay(event)
    expect(foldTurnUsage(once, event)).toBe(once)
  })

  it('ignores irrelevant and incomplete events without a new state', () => {
    const initial = initialTurnUsage()
    expect(foldTurnUsage(initial, { type: 'tool/result', data: {} })).toBe(initial)
    expect(foldTurnUsage(initial, { type: 'assistant/message', data: { turn: 1, step: 1 } })).toBe(initial)
    expect(foldTurnUsage(initial, { type: 'llm/retry-started', data: { turn: 4, step: 2 } })).toBe(initial)
  })
})
