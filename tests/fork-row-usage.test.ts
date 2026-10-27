import { describe, expect, it, vi } from 'vitest'
import {
  FORK_ROW_USAGE_MARK, FORK_ROW_USAGE_PROPERTY, applyForkRowUsage, applyForkRowUsageLabels, readForkRowUsage,
} from '../src/client/fork-row-usage.js'

/** Minimal stand-in for one published usage pill. */
function pill(attributes: Record<string, string>) {
  const values = new Map(Object.entries(attributes))
  return {
    getAttribute: (name: string) => values.get(name) ?? null,
    hasAttribute: (name: string) => values.has(name),
    setAttribute: vi.fn((name: string, value: string) => { values.set(name, value) }),
    style: { setProperty: vi.fn() },
    values,
  } as unknown as Element & { setAttribute: ReturnType<typeof vi.fn>, style: { setProperty: ReturnType<typeof vi.fn> }, values: Map<string, string> }
}

const published = (cacheRead: number, uncachedInput: number, output: number) => ({
  'data-dfac-usage': '2392',
  'data-dfac-cache-read': String(cacheRead),
  'data-dfac-uncached-input': String(uncachedInput),
  'data-dfac-output': String(output),
})

describe('compaction row usage', () => {
  it('reads the published summarizer buckets', () => {
    expect(readForkRowUsage(pill(published(172_800, 383, 2_449)))).toEqual({
      cacheReadTokens: 172_800, uncachedInputTokens: 383, outputTokens: 2_449,
    })
    expect(readForkRowUsage(pill({ 'data-dfac-usage': '1', 'data-dfac-cache-read': '1' }))).toBeUndefined()
    expect(readForkRowUsage(pill({ ...published(1, 1, 1), 'data-dfac-output': '-1' }))).toBeUndefined()
  })

  it('replaces the fallback text with the Turn pill format', () => {
    const element = pill(published(202_880, 445, 3_029))
    applyForkRowUsage(element)
    expect(element.setAttribute).toHaveBeenCalledWith(FORK_ROW_USAGE_MARK, 'true')
    expect(element.style.setProperty).toHaveBeenCalledWith(FORK_ROW_USAGE_PROPERTY, JSON.stringify('203K/445/3K'))
  })

  it('treats zero as a reported bucket and an absent one as unknown', () => {
    const element = pill({ 'data-dfac-usage': '7', 'data-dfac-cache-read': '0', 'data-dfac-uncached-input': '0', 'data-dfac-output': '0' })
    applyForkRowUsage(element)
    expect(element.setAttribute).toHaveBeenCalled()
    expect(element.style.setProperty).toHaveBeenCalledWith(FORK_ROW_USAGE_PROPERTY, JSON.stringify('0/0/0'))

    const incomplete = pill({ 'data-dfac-usage': '8', 'data-dfac-uncached-input': '1', 'data-dfac-output': '2' })
    applyForkRowUsage(incomplete)
    expect(incomplete.setAttribute).not.toHaveBeenCalled()
  })

  it('patches every published row under a root', () => {
    const first = pill(published(1_000, 2_000, 3_000))
    const second = pill(published(2_000_000, 3_000, 4_000))
    const root = { querySelectorAll: () => [first, second] } as unknown as ParentNode
    applyForkRowUsageLabels(root)
    expect(first.style.setProperty).toHaveBeenCalledWith(FORK_ROW_USAGE_PROPERTY, JSON.stringify('1K/2K/3K'))
    expect(second.style.setProperty).toHaveBeenCalledWith(FORK_ROW_USAGE_PROPERTY, JSON.stringify('2M/3K/4K'))
  })
})
