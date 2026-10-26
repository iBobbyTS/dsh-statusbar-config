/**
 * Per-Turn usage label: resolve one completed Turn's Token accounting from the
 * Chat snapshot and format it as cache-read / uncached-input / output.
 *
 * DSH 0.2.1 exposes no per-Turn usage Slot: the shipped pill is built inside
 * `TurnTailNodeView`, whose only replacement point is the whole `turn-tail`
 * Chat node (copy, branch, feedback, clock and two child Slots would have to
 * be re-owned). This module therefore only carries data and text; the
 * `TurnUsageLabel` entry hands the text to the scoped CSS override.
 */
import { formatTokens } from './stats.js'

/** The subset of a Turn's provider-reported buckets the label displays. */
export interface TurnUsageLike {
  /** Sum of uncached prompt input across every attempt in the Turn. */
  readonly uncachedInputTokens: number
  readonly outputTokens: number
  /** Absent when any attempt in the Turn omitted the bucket. */
  readonly cacheReadTokens?: number
}

/** Turn-tail Chat payload as the label reads it. */
export interface TurnTailDataLike {
  readonly tokenUsage?: TurnUsageLike
}

/**
 * Owning Turn handed to a Turn-tail contribution: DSH passes the resolved Turn
 * location, whose `turn` is the number the Turn-tail root carries; a bare
 * number is accepted for older or narrower assemblies.
 */
export type TurnOwnerLike = number | { readonly turn: number }

/** Structural observable source, matching the client store contract. */
export interface ObservableSnapshotLike<T> {
  getSnapshot(): T
  subscribe(listener: () => void): () => void
}

/** The single Chat node store member this plugin reads. */
export interface ChatNodeStoreLike {
  turnDataSource?(turn: number, kind: string): ObservableSnapshotLike<readonly TurnTailDataLike[]>
}

/** Minimal Chat snapshot shape: only the per-Turn node source is needed. */
export interface ChatSnapshotLike {
  readonly nodes?: ChatNodeStoreLike | undefined
}

const NO_USAGE: readonly TurnTailDataLike[] = Object.freeze([])

/**
 * Stable fallback source. Assemblies without the per-Turn reader, and Sessions
 * whose Turn carries no accounting, behave exactly like the shipped UI.
 */
export const NO_USAGE_SOURCE: ObservableSnapshotLike<readonly TurnTailDataLike[]> = Object.freeze({
  getSnapshot: () => NO_USAGE,
  subscribe: () => () => {},
})

/**
 * Read the Turn number out of the Turn-tail owner currency.
 * @param owner - the Turn location DSH passes, or a bare number.
 * @returns the owning Turn number.
 */
export function turnNumberOf(owner: TurnOwnerLike): number {
  return typeof owner === 'number' ? owner : owner.turn
}

/**
 * Resolve one Turn's observable Turn-tail data.
 * @param snapshot - Chat snapshot, absent outside an active Chat target.
 * @param turn - owning Turn number.
 * @returns the Turn's per-kind data source, or the shared empty source.
 */
export function readTurnUsageSource(
  snapshot: ChatSnapshotLike | undefined,
  turn: number,
): ObservableSnapshotLike<readonly TurnTailDataLike[]> {
  return snapshot?.nodes?.turnDataSource?.(turn, 'turn-tail') ?? NO_USAGE_SOURCE
}

/**
 * Format one Turn's usage as the composer footer's compact counters.
 * @param usage - the Turn's provider-reported accounting.
 * @returns `cache-read/uncached-input/output`, or null when cache reads were
 * never reported, so the shipped total stays visible instead of a fabricated 0.
 */
export function formatTurnUsageLabel(usage: TurnUsageLike | undefined): string | null {
  if (usage === undefined || usage.cacheReadTokens === undefined) return null
  return [
    formatTokens(usage.cacheReadTokens),
    formatTokens(usage.uncachedInputTokens),
    formatTokens(usage.outputTokens),
  ].join('/')
}

/**
 * Pick the label out of one Turn's Turn-tail entries; the latest entry wins.
 * @param data - entries in anchor order.
 * @returns the label, or null when no entry carries cache reads.
 */
export function turnUsageLabel(data: readonly TurnTailDataLike[]): string | null {
  for (let index = data.length - 1; index >= 0; index -= 1) {
    const label = formatTurnUsageLabel(data[index]?.tokenUsage)
    if (label !== null) return label
  }
  return null
}
