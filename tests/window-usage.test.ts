import { describe, expect, it } from 'vitest'
import { foldWindowUsage, initialWindowUsage, windowUsageProjectionDefinition } from '../src/window-usage.js'

const u = (cacheReadTokens: number, inputTokens: number, outputTokens: number, cacheWriteTokens = 0) =>
  ({ cacheReadTokens, inputTokens, outputTokens, cacheWriteTokens })
const message = (turn: number, step: number, usage: ReturnType<typeof u>) =>
  ({ type: 'assistant/message', data: { turn, step, usage, stream: [] } })
const attempt = (turn: number, step: number, usage: ReturnType<typeof u>) =>
  ({ type: 'assistant/attempt', data: { turn, step, stream: [
    { type: 'chunk', time: 1, chunk: { type: 'usage', usage } },
  ] } })
const end = (compactionId: string, error?: string) => ({
  type: 'compaction/end',
  data: { compactionId, turn: null, ...(error === undefined ? {} : { error }) },
})
const replay = (...events: unknown[]) => events.reduce(foldWindowUsage, initialWindowUsage())

describe('Window usage projection', () => {
  it('accumulates multiple Turns after success, not the previous epoch', () => {
    const result = replay(
      message(1, 1, u(60_000_000, 800_000, 100_000)),
      { type: 'compaction/start', data: { compactionId: 'c1', turn: null } },
      { type: 'compaction/summary', data: { compactionId: 'c1', usage: u(5, 5, 5) } },
      end('c1'),
      message(2, 1, u(6_000_000, 120_000, 20_000)),
      message(3, 1, u(4_000_000, 80_000, 10_000)),
    )
    expect(result.window).toEqual({
      uncachedInputTokens: 200_000, cacheReadTokens: 10_000_000,
      cacheWriteTokens: 0, outputTokens: 30_000, compactionCount: 1,
    })
    expect(windowUsageProjectionDefinition.wire.viewSchema.parse(result.window)).toEqual(result.window)
  })

  it('does not reset on failed compaction', () => {
    const result = replay(message(1, 1, u(500, 40, 10)), end('bad', 'aborted'),
      message(2, 1, u(50, 5, 2)))
    expect(result.window.cacheReadTokens).toBe(550)
    expect(result.window.compactionCount).toBe(0)
  })

  it('replaces a same-step stream sample by the final message usage', () => {
    const result = replay(attempt(1, 1, u(300, 20, 10)),
      message(1, 1, u(350, 20, 15)), message(2, 1, u(100, 5, 5)))
    expect(result.window).toMatchObject({ cacheReadTokens: 450, outputTokens: 20 })
  })

  it('adds separately billed retries', () => {
    const result = replay(attempt(1, 1, u(300, 20, 10)),
      { type: 'llm/retry-started', data: { turn: 1, step: 1 } },
      message(1, 1, u(350, 30, 15)))
    expect(result.window).toMatchObject({ cacheReadTokens: 650, uncachedInputTokens: 50, outputTokens: 25 })
  })

  it('resets on each additional successful compaction', () => {
    const result = replay(message(1, 1, u(100, 20, 5)), end('one'),
      message(2, 1, u(200, 30, 10)), end('two'), message(3, 1, u(300, 40, 15)))
    expect(result.window).toMatchObject({
      cacheReadTokens: 300, uncachedInputTokens: 40, outputTokens: 15, compactionCount: 2,
    })
  })

  it('ignores irrelevant and incomplete events without rerendering', () => {
    const initial = initialWindowUsage()
    expect(foldWindowUsage(initial, { type: 'tool/result', data: {} })).toBe(initial)
    expect(foldWindowUsage(initial, { type: 'assistant/message', data: { turn: 1, step: 1 } })).toBe(initial)
  })
})
