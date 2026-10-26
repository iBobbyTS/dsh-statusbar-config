import { describe, expect, it, vi } from 'vitest'
import {
  NO_USAGE_SOURCE, formatTurnUsageLabel, readTurnUsageSource, turnNumberOf, turnUsageLabel,
} from '../src/client/turn-usage.js'
import type { ChatSnapshotLike, TurnTailDataLike } from '../src/client/turn-usage.js'

const usage = { cacheReadTokens: 70_000_000, uncachedInputTokens: 1_000_000, outputTokens: 130_000 }

describe('turnNumberOf', () => {
  it('reads the number out of the Turn location DSH hands to Turn tails', () => {
    expect(turnNumberOf({ turn: 54, start: {}, end: {}, status: 'closed', steps: [] })).toBe(54)
  })

  it('accepts a bare Turn number', () => {
    expect(turnNumberOf(7)).toBe(7)
  })
})

describe('formatTurnUsageLabel', () => {
  it('renders cache-read / uncached-input / output in compact counters', () => {
    expect(formatTurnUsageLabel(usage)).toBe('70M/1M/130K')
  })

  it('keeps small counts exact and rounds only the scaled unit', () => {
    expect(formatTurnUsageLabel({ cacheReadTokens: 517, uncachedInputTokens: 999, outputTokens: 12 }))
      .toBe('517/999/12')
    expect(formatTurnUsageLabel({ cacheReadTokens: 1_050, uncachedInputTokens: 2_460_000, outputTokens: 99_600 }))
      .toBe('1.1K/2.5M/99.6K')
  })

  it('shows a reported zero cache read', () => {
    expect(formatTurnUsageLabel({ cacheReadTokens: 0, uncachedInputTokens: 8_200, outputTokens: 31 }))
      .toBe('0/8.2K/31')
  })

  it('declines to label when cache reads were never reported', () => {
    expect(formatTurnUsageLabel({ uncachedInputTokens: 8_200, outputTokens: 31 })).toBeNull()
    expect(formatTurnUsageLabel(undefined)).toBeNull()
  })
})

describe('readTurnUsageSource', () => {
  it('falls back to the shared empty source without a Chat snapshot', () => {
    expect(readTurnUsageSource(undefined, 3)).toBe(NO_USAGE_SOURCE)
    expect(readTurnUsageSource({}, 3).getSnapshot()).toEqual([])
  })

  it('falls back when the assembly has no per-Turn reader', () => {
    expect(readTurnUsageSource({ nodes: {} }, 3)).toBe(NO_USAGE_SOURCE)
  })

  it('reads the Turn-tail kind of the owning Turn', () => {
    const data: readonly TurnTailDataLike[] = [{ tokenUsage: usage }]
    const source = { getSnapshot: () => data, subscribe: () => () => {} }
    const turnDataSource = vi.fn(() => source)
    const snapshot: ChatSnapshotLike = { nodes: { turnDataSource } }
    expect(readTurnUsageSource(snapshot, 42)).toBe(source)
    expect(turnDataSource).toHaveBeenCalledWith(42, 'turn-tail')
  })
})

describe('turnUsageLabel', () => {
  it('takes the latest entry that carries usage', () => {
    expect(turnUsageLabel([{ tokenUsage: usage }, {}, { tokenUsage: { ...usage, outputTokens: 1 } }]))
      .toBe('70M/1M/1')
  })

  it('returns null when no entry carries cache reads', () => {
    expect(turnUsageLabel([])).toBeNull()
    expect(turnUsageLabel([{}, { tokenUsage: { uncachedInputTokens: 1, outputTokens: 2 } }])).toBeNull()
  })
})
