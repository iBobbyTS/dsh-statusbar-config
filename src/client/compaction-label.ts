/**
 * Compaction marker label: the shipped `/compact` and automatic-compaction
 * rows print the estimated size of the replaced history
 * (`已压缩 709 条历史记录（约 413235 tokens）`). This swaps only that summary
 * text for the summarization call's own `所有输入之和 → 输出` Token usage.
 *
 * There is a `conversation.chat.commandview` Slot keyed by command name, but
 * replacing the row would re-own the context icon, the hover disclosure, the
 * expandable Markdown summary and the pinned-header layout. The Host
 * projection therefore carries the usage, a invisible decorator (the
 * composer dock entry, which is always mounted) matches each rendered marker
 * by the two counts it still prints when that pair is unique. The stylesheet hides the
 * shipped text and shows the label from a custom property. The row itself
 * stays exactly the shipped one.
 */
import { useLayoutEffect, type RefObject } from 'react'
import { formatTokens } from './stats.js'
import type { CompactionUsageEntry } from './types.js'

/** Host projection key carrying one entry per landed compaction. */
export const COMPACTION_USAGE_PROJECTION = 'statusbarCompactionUsage'

/** Row marker set on a compaction button whose summary was replaced. */
export const COMPACTION_LABEL_ATTRIBUTE = 'data-dsc-compaction-label'

/** Custom property carrying the quoted replacement label on that button. */
export const COMPACTION_LABEL_PROPERTY = '--dsc-compaction-label'

/** The shipped marker's context icon; only compaction rows carry it. */
const MARKER_ICON = '[data-compaction-icon="context"]'

/** Structural projection reader, matching the Session standard props kit. */
export type ProjectionReader = <T>(name: string) => T | undefined

/** Counts the shipped marker prints for one compaction. */
export interface ShadowedCounts {
  items: number
  tokens: number
}

/**
 * Format one compaction's summarizer usage.
 * @param entry - projection entry for the compaction.
 * @returns `输入合计→输出 tokens`, e.g. `173.3K→2.4K tokens`.
 */
export function compactionUsageLabel(entry: CompactionUsageEntry): string {
  return `${formatTokens(entry.inputTokens)}→${formatTokens(entry.outputTokens)} tokens`
}

/**
 * Read the `items`/`tokens` pair out of the shipped summary text. Locale
 * independent: both dictionaries print exactly those two integers.
 * @param text - the rendered summary text.
 * @returns the pair, or undefined when the marker printed a fallback string.
 */
export function shadowedCounts(text: string): ShadowedCounts | undefined {
  const numbers = text.match(/\d[\d,]*/g)
  if (numbers === null || numbers.length !== 2) return
  const items = Number(numbers[0]?.replaceAll(',', ''))
  const tokens = Number(numbers[1]?.replaceAll(',', ''))
  if (!Number.isSafeInteger(items) || !Number.isSafeInteger(tokens)) return
  return { items, tokens }
}

/** Stable lookup key for one marker's printed counts. */
export function countsKey(counts: ShadowedCounts): string {
  return `${counts.items}/${counts.tokens}`
}

/** Index the projection entries by the counts each marker prints. */
export function entriesByCounts(entries: readonly CompactionUsageEntry[]): Map<string, CompactionUsageEntry> {
  const byCounts = new Map<string, CompactionUsageEntry>()
  const ambiguous = new Set<string>()
  for (const entry of entries) {
    const key = countsKey(entry)
    if (byCounts.has(key)) ambiguous.add(key)
    else byCounts.set(key, entry)
  }
  for (const key of ambiguous) byCounts.delete(key)
  return byCounts
}

/**
 * Replace one marker's summary text when the projection covers its counts.
 * Idempotent: re-applying rewrites the same attribute and property.
 * @param button - the compaction marker's button.
 * @param byCounts - projection entries indexed by printed counts.
 * @returns whether the row was labelled.
 */
export function labelMarkerButton(button: Element, byCounts: Map<string, CompactionUsageEntry>): boolean {
  const summary = button.lastElementChild
  const counts = summary === null ? undefined : shadowedCounts(summary.textContent ?? '')
  const entry = counts === undefined ? undefined : byCounts.get(countsKey(counts))
  if (entry === undefined) {
    clearMarkerLabel(button)
    return false
  }
  button.setAttribute(COMPACTION_LABEL_ATTRIBUTE, 'true')
  ;(button as HTMLElement).style.setProperty(COMPACTION_LABEL_PROPERTY, JSON.stringify(compactionUsageLabel(entry)))
  return true
}

/** Release only the text decoration owned by this plugin. */
function clearMarkerLabel(button: Element): void {
  button.removeAttribute(COMPACTION_LABEL_ATTRIBUTE)
  ;(button as HTMLElement).style.removeProperty(COMPACTION_LABEL_PROPERTY)
}

/**
 * Collect the marker buttons among nodes just inserted into the document.
 * @param nodes - one mutation record's added nodes.
 * @returns the affected compaction buttons; callers deduplicate.
 */
export function markerButtonsIn(nodes: Iterable<Node>): Element[] {
  const buttons: Element[] = []
  for (const node of nodes) {
    if (node.nodeType !== 1) continue
    const element = node as Element
    if (element.matches(MARKER_ICON)) {
      const button = element.closest('button')
      if (button !== null) buttons.push(button)
      continue
    }
    if (element.querySelector(MARKER_ICON) === null) continue
    for (const icon of element.querySelectorAll(MARKER_ICON)) {
      const button = icon.closest('button')
      if (button !== null) buttons.push(button)
    }
  }
  return buttons
}

/**
 * Replace the summary text of every compaction marker the projection covers.
 * @param root - document or subtree containing the markers.
 * @param entries - projection entries for this Session.
 */
export function applyCompactionLabels(root: ParentNode, entries: readonly CompactionUsageEntry[]): void {
  const byCounts = entriesByCounts(entries)
  for (const icon of root.querySelectorAll(MARKER_ICON)) {
    const button = icon.closest('button')
    if (button !== null) labelMarkerButton(button, byCounts)
  }
}

/**
 * Keep every rendered compaction marker labelled with its summarizer usage.
 * Mounted from the always-rendered composer dock entry, so it shares the
 * Session projection seat instead of owning a row of its own. One layout pass
 * covers the rows already painted; a MutationObserver covers the ones the
 * transcript mounts later.
 * @param useProjection - Session standard-props projection reader.
 */
export function useCompactionLabelPatch(useProjection: ProjectionReader, anchor: RefObject<HTMLElement>, sessionId: string): void {
  const entries = useProjection<readonly CompactionUsageEntry[]>(COMPACTION_USAGE_PROJECTION)

  useLayoutEffect(() => {
    const scope = anchor.current?.closest('[data-conversation-content]')
    if (scope === undefined || scope === null) return
    applyCompactionLabels(scope, entries ?? [])
    if (typeof MutationObserver === 'undefined') return () => { applyCompactionLabels(scope, []) }
    const queue = new Set<Element>()
    let frame: number | undefined
    const flush = () => {
      frame = undefined
      const pending = [...queue]
      queue.clear()
      const byCounts = entriesByCounts(entries ?? [])
      for (const button of pending) {
        if (scope.contains(button)) labelMarkerButton(button, byCounts)
      }
    }
    const schedule = (buttons: readonly Element[]) => {
      if (buttons.length === 0) return
      for (const button of buttons) queue.add(button)
      if (frame !== undefined) return
      frame = typeof requestAnimationFrame === 'undefined' ? undefined : requestAnimationFrame(flush)
      if (frame === undefined) flush()
    }
    const observer = new MutationObserver(records => {
      const touched: Element[] = []
      for (const record of records) {
        touched.push(...markerButtonsIn(record.addedNodes))
        // The summary text can also arrive as a later text/child update, and
        // the marker may be inserted before it is filled in.
        const target = record.target
        const element = target.nodeType === 1 ? target as Element : target.parentElement
        if (element === null) continue
        const owner = element.closest('button')
        if (owner !== null && owner.querySelector(MARKER_ICON) !== null) touched.push(owner)
      }
      schedule(touched)
    })
    observer.observe(scope, { childList: true, subtree: true, characterData: true })
    return () => {
      observer.disconnect()
      if (frame !== undefined) cancelAnimationFrame(frame)
      applyCompactionLabels(scope, [])
    }
  }, [entries, anchor, sessionId])
}
