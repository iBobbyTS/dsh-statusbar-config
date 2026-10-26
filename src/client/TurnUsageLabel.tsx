/**
 * Invisible per-Turn decorator. DSH builds the completed-Turn usage pill inside
 * `TurnTailNodeView` and offers no Slot for it, so this entry publishes the
 * Turn's cache-read / uncached-input / output label on the Turn-tail root and
 * the plugin's scoped CSS swaps the shipped text. It renders nothing, so the
 * tail's flex layout and the native dialog, hover, icon and narrow-viewport
 * collapse all stay exactly as shipped.
 */
import { useLayoutEffect, useSyncExternalStore } from 'react'
import type { SnapshotSelector } from './types.js'
import {
  readTurnUsageSource, turnNumberOf, turnUsageLabel, type ChatSnapshotLike, type TurnOwnerLike,
} from './turn-usage.js'

/** Turn-tail root marker; the scoped CSS only rewrites a marked tail. */
export const TURN_USAGE_ATTRIBUTE = 'data-dsc-turn-usage'

/** Turn-tail root custom property carrying the quoted label text. */
export const TURN_USAGE_LABEL_PROPERTY = '--dsc-turn-usage-label'

export interface TurnUsageLabelProps {
  /** Owning completed Turn, as the Turn-tail owner hands it over. */
  turn: TurnOwnerLike
  useChat: SnapshotSelector<ChatSnapshotLike>
}

/**
 * Publish one Turn's usage label on its Turn-tail root.
 * @param props - owning Turn and the Chat snapshot selector seat.
 * @returns null; this entry owns no visible row of its own.
 */
export function TurnUsageLabel({ turn, useChat }: TurnUsageLabelProps): null {
  const turnNumber = turnNumberOf(turn)
  const source = useChat(snapshot => readTurnUsageSource(snapshot, turnNumber))
  const data = useSyncExternalStore(source.subscribe, source.getSnapshot, source.getSnapshot)
  const label = turnUsageLabel(data)

  useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>(`[data-turn-tail="${turnNumber}"]`)
    if (root === null || label === null) return
    // The label lives on the tail root, not on the pill: React may recreate the
    // pill's button while the root persists, and inheritance keeps the text.
    const value = JSON.stringify(label)
    root.setAttribute(TURN_USAGE_ATTRIBUTE, 'true')
    root.style.setProperty(TURN_USAGE_LABEL_PROPERTY, value)
    return () => {
      if (root.style.getPropertyValue(TURN_USAGE_LABEL_PROPERTY) === value) {
        root.style.removeProperty(TURN_USAGE_LABEL_PROPERTY)
      }
      root.removeAttribute(TURN_USAGE_ATTRIBUTE)
    }
  }, [turnNumber, label])

  return null
}
