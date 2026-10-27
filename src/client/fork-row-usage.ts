/**
 * Compaction-row usage: `@local/dsh-fork-after-compaction` renders the shipped
 * completed-Turn IconActions chrome (copy, branch, usage, clock) under each
 * landed context compaction. DSH ships no standalone usage component or Slot,
 * so that row publishes its summarizer buckets on itself and this plugin owns
 * the display format here too — the row's fallback text is replaced with the
 * same cache-read/uncached-input/output label the shipped Turn pill gets.
 *
 * The row dispatches a bubbling `dsh-fork-row-usage` event when it mounts; this
 * patch also scans the document once for rows that mounted before the plugin.
 * Nothing is polled, and the usage pill, its database glyph and the
 * narrow-viewport icon-only collapse stay exactly the row's own.
 */
import { useLayoutEffect } from 'react'
import { formatTurnUsageLabel, type TurnUsageLike } from './turn-usage.js'

/** Row marker published by the fork plugin: the compaction's summary event seq. */
export const FORK_ROW_USAGE_ATTRIBUTE = 'data-dfac-usage'

/** Label element published by the fork plugin; hidden while this patch owns it. */
export const FORK_ROW_LABEL_ATTRIBUTE = 'data-dfac-usage-label'

/** Decoration attribute set on a usage pill whose text was replaced. */
export const FORK_ROW_USAGE_MARK = 'data-dsc-fork-row-usage'

/** Custom property carrying the quoted label text on that pill. */
export const FORK_ROW_USAGE_PROPERTY = '--dsc-fork-row-usage-label'

/** Bubbling event the fork plugin dispatches when a row mounts. */
export const FORK_ROW_USAGE_EVENT = 'dsh-fork-row-usage'

const COUNT = /^(0|[1-9]\d*)$/

/** Read one published non-negative integer attribute. */
function countAttribute(element: Element, name: string): number | undefined {
  const raw = element.getAttribute(name)
  if (raw === null || !COUNT.test(raw)) return undefined
  const value = Number(raw)
  return Number.isSafeInteger(value) ? value : undefined
}

/**
 * Read one published row's summarizer buckets.
 * @param element - the row's usage pill.
 * @returns the buckets, or undefined when the row published no complete usage.
 */
export function readForkRowUsage(element: Element): TurnUsageLike | undefined {
  const cacheReadTokens = countAttribute(element, 'data-dfac-cache-read')
  const uncachedInputTokens = countAttribute(element, 'data-dfac-uncached-input')
  const outputTokens = countAttribute(element, 'data-dfac-output')
  if (cacheReadTokens === undefined || uncachedInputTokens === undefined || outputTokens === undefined) return
  return { cacheReadTokens, uncachedInputTokens, outputTokens }
}

/**
 * Replace one compaction row's fallback usage text.
 * @param element - the row's usage pill.
 */
export function applyForkRowUsage(element: Element): void {
  const usage = readForkRowUsage(element)
  if (usage === undefined) return
  const label = formatTurnUsageLabel(usage)
  if (label === null) return
  element.setAttribute(FORK_ROW_USAGE_MARK, 'true')
  ;(element as HTMLElement).style.setProperty(FORK_ROW_USAGE_PROPERTY, JSON.stringify(label))
}

/**
 * Replace every published row's usage text under a root.
 * @param root - document or subtree containing the rows.
 */
export function applyForkRowUsageLabels(root: ParentNode): void {
  for (const element of root.querySelectorAll(`[${FORK_ROW_USAGE_ATTRIBUTE}]`)) applyForkRowUsage(element)
}

/**
 * Keep every rendered compaction row labelled with this plugin's format.
 * Mounted from the always-rendered composer dock entry, like the marker patch.
 */
export function useForkRowUsagePatch(): void {
  useLayoutEffect(() => {
    if (typeof document === 'undefined') return
    applyForkRowUsageLabels(document)
    const onRow = (event: Event) => {
      const target = event.target
      if (target instanceof Element && target.hasAttribute(FORK_ROW_USAGE_ATTRIBUTE)) {
        applyForkRowUsage(target)
      }
    }
    document.addEventListener(FORK_ROW_USAGE_EVENT, onRow)
    // A row can mount in the same commit as this dock entry.
    const timer = setTimeout(() => { applyForkRowUsageLabels(document) }, 300)
    return () => {
      document.removeEventListener(FORK_ROW_USAGE_EVENT, onRow)
      clearTimeout(timer)
    }
  }, [])
}
