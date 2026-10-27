/**
 * Summarizer usage of each landed compaction, for the transcript's compaction
 * marker.
 *
 * The durable `compaction/summary` event carries the summarization request's
 * provider-reported `usage`, but the Chat node built from that event drops it:
 * the shipped marker only prints the estimated size of the replaced history
 * (`shadowedSeqs.length` items and `shadowedTokenCount` tokens). This
 * projection keeps the usage next to those two counts, which is what the
 * Client half matches the rendered marker against — so the row can show the
 * summarization call's own input → output instead of the history estimate,
 * without replacing the shipped row.
 *
 * Summarizer usage is billed outside the Session `tokenUsage` and outside the
 * Window epoch, so it is displayed on its own marker and never folded into
 * either running total.
 */
import { z } from 'zod'
import { asRecord, bucketsFrom, isCount } from './usage-buckets.js'

const entrySchema = z.object({
  /** Seq of the durable `compaction/summary` event; keeps replay idempotent. */
  seq: z.number().int().nonnegative(),
  /** Replaced history items the shipped marker prints. */
  items: z.number().int().nonnegative(),
  /** Estimated replaced history tokens the shipped marker prints. */
  tokens: z.number().int().nonnegative(),
  /** All prompt input of the summarization call: uncached + cache read + cache write. */
  inputTokens: z.number().int().nonnegative(),
  /** Summarization output tokens. */
  outputTokens: z.number().int().nonnegative(),
}).strict()

const viewSchema = z.array(entrySchema)

const stateSchema = z.object({
  entries: z.array(entrySchema),
}).strict()

export type CompactionUsageEntry = z.infer<typeof entrySchema>
export type CompactionUsageView = z.infer<typeof viewSchema>
export type CompactionUsageState = z.infer<typeof stateSchema>

/** Retained markers; a Chat window never shows more than a handful. */
const MAX_ENTRIES = 32

export function initialCompactionUsage(): CompactionUsageState {
  return { entries: [] }
}

/**
 * Pure event fold: one entry per `compaction/summary` that reports both the
 * replaced-history counts and the summarizer usage.
 * @param state - state covering all prior events.
 * @param incoming - the next committed Session event.
 * @returns the same state reference for every unrelated event.
 */
export function foldCompactionUsage(state: CompactionUsageState, incoming: unknown): CompactionUsageState {
  const event = asRecord(incoming)
  if (event?.type !== 'compaction/summary') return state
  if (!isCount(event.seq)) return state
  if (state.entries.some(entry => entry.seq === event.seq)) return state

  const data = asRecord(event.data)
  if (!data) return state
  if (!Array.isArray(data.shadowedSeqs) || !isCount(data.shadowedTokenCount)) return state
  const usage = bucketsFrom(data.usage)
  if (usage === undefined) return state

  const entry: CompactionUsageEntry = {
    seq: event.seq,
    items: data.shadowedSeqs.length,
    tokens: data.shadowedTokenCount,
    inputTokens: usage.uncachedInputTokens + usage.cacheReadTokens + usage.cacheWriteTokens,
    outputTokens: usage.outputTokens,
  }
  return { entries: [...state.entries, entry].slice(-MAX_ENTRIES) }
}

export const compactionUsageProjectionDefinition = {
  key: 'statusbarCompactionUsage',
  stateVersion: 1,
  stateSchema,
  init: initialCompactionUsage,
  apply: foldCompactionUsage,
  wire: {
    viewSchema,
    summary: false,
    view: (state: CompactionUsageState): CompactionUsageView => state.entries,
  },
}
