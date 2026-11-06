/**
 * Invisible per-Turn decorator. DSH builds the completed-Turn usage pill inside
 * `TurnTailNodeView` and offers no Slot for it, so this entry publishes the
 * Turn's cache-read / uncached-input / output label on the Turn-tail root and
 * the plugin's scoped CSS swaps the shipped text. Its hidden anchor leaves the
 * tail's flex layout and the native dialog, hover, icon and narrow-viewport
 * collapse all stay exactly as shipped.
 */
import { useLayoutEffect, useRef, useSyncExternalStore, type ReactElement } from 'react'
import type { ProjectionReader } from './compaction-label.js'
import type { SnapshotSelector, TurnUsageEntry } from './types.js'
import {
  TURN_USAGE_PROJECTION, readTurnUsageSource, resolveTurnUsageLabel, turnNumberOf, turnUsageEntryFor,
  type ChatSnapshotLike, type TurnOwnerLike,
} from './turn-usage.js'

/** Turn-tail root marker; the scoped CSS only rewrites a marked tail. */
export const TURN_USAGE_ATTRIBUTE = 'data-dsc-turn-usage'

/** Turn-tail root custom property carrying the quoted label text. */
export const TURN_USAGE_LABEL_PROPERTY = '--dsc-turn-usage-label'

export interface TurnUsageLabelProps {
  sessionId: string
  /** Owning completed Turn, as the Turn-tail owner hands it over. */
  turn: TurnOwnerLike
  useChat: SnapshotSelector<ChatSnapshotLike>
  /** Session standard-props projection reader; narrower assemblies omit it. */
  useProjection?: ProjectionReader
}

/**
 * Publish one Turn's usage label on its Turn-tail root.
 * @param props - owning Turn, the Chat snapshot selector seat, and the Session
 * projection reader carrying the plugin's own per-Turn sums.
 * @returns an invisible anchor inside the owning Turn tail.
 */
export function TurnUsageLabel({ sessionId, turn, useChat, useProjection }: TurnUsageLabelProps): ReactElement {
  const anchor = useRef<HTMLSpanElement>(null)
  const turnNumber = turnNumberOf(turn)
  const source = useChat(snapshot => readTurnUsageSource(snapshot, turnNumber))
  const data = useSyncExternalStore(source.subscribe, source.getSnapshot, source.getSnapshot)
  const entries = useProjection === undefined
    ? undefined
    : useProjection<readonly TurnUsageEntry[]>(TURN_USAGE_PROJECTION)
  const label = resolveTurnUsageLabel(data, turnUsageEntryFor(entries, turnNumber))

  useLayoutEffect(() => {
    const root = anchor.current?.closest<HTMLElement>('[data-turn-tail]') ?? null
    if (root === null || label === null) return
    // The label lives on the tail root, not on the pill: React may recreate the
    // pill's button while the root persists, and inheritance keeps the text.
    const value = JSON.stringify(label)
    root.setAttribute(TURN_USAGE_ATTRIBUTE, 'true')
    root.style.setProperty(TURN_USAGE_LABEL_PROPERTY, value)
    return () => {
      if (root.style.getPropertyValue(TURN_USAGE_LABEL_PROPERTY) === value) {
        root.style.removeProperty(TURN_USAGE_LABEL_PROPERTY)
        root.removeAttribute(TURN_USAGE_ATTRIBUTE)
      }
    }
  }, [sessionId, turnNumber, label])

  return <span hidden aria-hidden="true" ref={anchor} />
}
