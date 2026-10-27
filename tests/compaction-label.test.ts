import { describe, expect, it, vi } from 'vitest'
import {
  COMPACTION_LABEL_ATTRIBUTE, COMPACTION_LABEL_PROPERTY, applyCompactionLabels, compactionUsageLabel,
  countsKey, entriesByCounts, labelMarkerButton, markerButtonsIn, shadowedCounts,
} from '../src/client/compaction-label.js'
import type { CompactionUsageEntry } from '../src/client/types.js'

const entry: CompactionUsageEntry = {
  seq: 2392, items: 709, tokens: 413_235, inputTokens: 173_311, outputTokens: 2_449,
}

/** Minimal stand-in for one shipped compaction button and its marker icon. */
function marker(summaryText: string) {
  const button = {
    lastElementChild: { textContent: summaryText },
    setAttribute: vi.fn(),
    style: { setProperty: vi.fn() },
  }
  const icon = { closest: () => button }
  const root = { querySelectorAll: () => [icon] } as unknown as ParentNode
  return { root, button }
}

describe('compaction marker label', () => {
  it('formats the summarizer usage as input total → output', () => {
    expect(compactionUsageLabel(entry)).toBe('173K→2.4K tokens')
    expect(compactionUsageLabel({ ...entry, inputTokens: 383, outputTokens: 12 })).toBe('383→12 tokens')
  })

  it('reads the printed counts in both shipped locales', () => {
    expect(shadowedCounts('已压缩 709 条历史记录（约 413235 tokens）')).toEqual({ items: 709, tokens: 413_235 })
    expect(shadowedCounts('Compacted 709 history items (~413235 tokens)')).toEqual({ items: 709, tokens: 413_235 })
    expect(shadowedCounts('Compacted 1,024 history items (~12,345 tokens)')).toEqual({ items: 1_024, tokens: 12_345 })
  })

  it('leaves fallback summaries alone', () => {
    expect(shadowedCounts('压缩摘要不可用')).toBeUndefined()
    expect(shadowedCounts('')).toBeUndefined()
    // A summary that printed anything besides the two counts is not matched.
    expect(shadowedCounts('16 items 11309 tokens 3 retries')).toBeUndefined()
  })

  it('marks only the marker whose counts the projection covers', () => {
    const matched = marker('已压缩 709 条历史记录（约 413235 tokens）')
    applyCompactionLabels(matched.root, [entry])
    expect(matched.button.setAttribute).toHaveBeenCalledWith(COMPACTION_LABEL_ATTRIBUTE, 'true')
    expect(matched.button.style.setProperty).toHaveBeenCalledWith(
      COMPACTION_LABEL_PROPERTY, JSON.stringify('173K→2.4K tokens'),
    )

    const unmatched = marker('已压缩 16 条历史记录（约 11309 tokens）')
    applyCompactionLabels(unmatched.root, [entry])
    expect(unmatched.button.setAttribute).not.toHaveBeenCalled()
  })

  it('keys entries by the counts each marker prints', () => {
    expect(countsKey(entry)).toBe('709/413235')
    expect(countsKey(shadowedCounts('已压缩 709 条历史记录（约 413235 tokens）')!)).toBe(countsKey(entry))
  })

  it('labels a marker through the per-button entry point', () => {
    const covered = marker('已压缩 709 条历史记录（约 413235 tokens）')
    expect(labelMarkerButton(covered.button as unknown as Element, entriesByCounts([entry]))).toBe(true)
    expect(covered.button.setAttribute).toHaveBeenCalledWith(COMPACTION_LABEL_ATTRIBUTE, 'true')

    const uncovered = marker('已压缩 331 条历史记录（约 150611 tokens）')
    expect(labelMarkerButton(uncovered.button as unknown as Element, entriesByCounts([entry]))).toBe(false)
    expect(uncovered.button.setAttribute).not.toHaveBeenCalled()
  })

  it('finds the markers a later transcript mount inserted', () => {
    const button = marker('已压缩 709 条历史记录（约 413235 tokens）').button
    const icon = { closest: () => button }
    const subtree = {
      nodeType: 1,
      matches: () => false,
      querySelector: () => icon,
      querySelectorAll: () => [icon],
    } as unknown as Node
    const iconNode = {
      nodeType: 1,
      matches: () => true,
      closest: () => button,
    } as unknown as Node
    expect(markerButtonsIn([subtree, iconNode])).toEqual([button, button])

    // Text nodes and subtrees without a marker cost nothing.
    const text = { nodeType: 3 } as unknown as Node
    const unrelated = {
      nodeType: 1,
      matches: () => false,
      querySelector: () => null,
    } as unknown as Node
    expect(markerButtonsIn([text, unrelated])).toEqual([])
  })
})
