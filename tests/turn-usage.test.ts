import { describe, expect, it, vi } from 'vitest'
import {
  NO_USAGE_SOURCE, TURN_USAGE_PROJECTION, formatTurnBucketsLabel, formatTurnUsageLabel,
  readTurnUsageSource, resolveTurnUsageLabel, turnNumberOf, turnUsageEntryFor, turnUsageLabel,
} from '../src/client/turn-usage.js'
import type { ChatSnapshotLike, TurnTailDataLike } from '../src/client/turn-usage.js'
import type { TurnUsageEntry } from '../src/client/types.js'

const usage = { cacheReadTokens: 70_000_000, uncachedInputTokens: 1_000_000, outputTokens: 130_000 }

describe('turnNumberOf', () => {
  it('reads the number out of the Turn location DSH hands to Turn tails', () => {
    const location = { turn: 54, start: {}, end: {}, status: 'closed', steps: [] }
    expect(turnNumberOf(location)).toBe(54)
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

describe('formatTurnBucketsLabel', () => {
  it('renders the plugin-summed split in the same compact counters', () => {
    expect(formatTurnBucketsLabel({
      turn: 1, uncachedInputTokens: 47_370, cacheReadTokens: 684_096, cacheWriteTokens: 0, outputTokens: 9_253,
    })).toBe('684K/47.4K/9.3K')
  })

  it('keeps a Turn whose every attempt omitted cache reads at an explicit zero', () => {
    expect(formatTurnBucketsLabel({
      turn: 2, uncachedInputTokens: 8_200, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 31,
    })).toBe('0/8.2K/31')
  })
})

describe('turnUsageEntryFor', () => {
  const entries: readonly TurnUsageEntry[] = [
    { turn: 1, uncachedInputTokens: 1, cacheReadTokens: 2, cacheWriteTokens: 0, outputTokens: 3 },
    { turn: 2, uncachedInputTokens: 4, cacheReadTokens: 5, cacheWriteTokens: 0, outputTokens: 6 },
  ]

  it('finds the Turn an entry belongs to', () => {
    expect(turnUsageEntryFor(entries, 2)).toBe(entries[1])
  })

  it('stays undefined for an unloaded projection or an unbilled Turn', () => {
    expect(turnUsageEntryFor(undefined, 1)).toBeUndefined()
    expect(turnUsageEntryFor(entries, 3)).toBeUndefined()
  })
})

describe('resolveTurnUsageLabel', () => {
  const fallback: TurnUsageEntry = {
    turn: 1, uncachedInputTokens: 47_370, cacheReadTokens: 684_096, cacheWriteTokens: 0, outputTokens: 9_253,
  }

  it('prefers the shipped Turn-tail aggregate while it carries cache reads', () => {
    expect(resolveTurnUsageLabel([{ tokenUsage: usage }], fallback)).toBe('70M/1M/130K')
  })

  it('falls back to the plugin sum with omitted buckets as zero', () => {
    expect(resolveTurnUsageLabel([{ tokenUsage: { uncachedInputTokens: 47_370, outputTokens: 9_253 } }], fallback))
      .toBe('684K/47.4K/9.3K')
    expect(resolveTurnUsageLabel([], fallback)).toBe('684K/47.4K/9.3K')
  })

  it('returns null only when neither source carries accounting', () => {
    expect(resolveTurnUsageLabel([], undefined)).toBeNull()
    expect(resolveTurnUsageLabel([{ tokenUsage: { uncachedInputTokens: 1, outputTokens: 2 } }], undefined)).toBeNull()
  })

  it('reads the Host projection under its registered key', () => {
    expect(TURN_USAGE_PROJECTION).toBe('statusbarTurnUsage')
  })
})
