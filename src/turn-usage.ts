/**
 * Per-Turn token sums over the provider-reported usage events.
 *
 * DSH's Turn-tail `tokenUsage` marks the whole cache-read bucket unknown once
 * any attempt in the Turn omitted it, so the per-Turn pill falls back to the
 * shipped total. This projection sums the same authoritative events the Window
 * epoch folds — with an omitted bucket counting as zero — giving every Turn a
 * complete split the pill can fall back to.
 */
import { z } from 'zod'
import { asRecord, bucketsSchema, equalTokenBuckets, isCount, usageOfEvent } from './usage-buckets.js'

/** One Turn's summed buckets, keyed by the Turn number Turn tails carry. */
const entrySchema = z.object({
  turn: z.number().int().nonnegative(),
  uncachedInputTokens: z.number().int().nonnegative(),
  cacheReadTokens: z.number().int().nonnegative(),
  cacheWriteTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
}).strict()

const stateSchema = z.object({
  entries: z.array(entrySchema),
  last: z.object({
    turn: z.number().int().nonnegative(),
    step: z.number().int().nonnegative(),
    buckets: bucketsSchema,
  }).nullable(),
}).strict()

export type TurnUsageEntry = z.infer<typeof entrySchema>
export type TurnUsageState = z.infer<typeof stateSchema>

export function initialTurnUsage(): TurnUsageState {
  return { entries: [], last: null }
}

function zeroBuckets(turn: number): TurnUsageEntry {
  return { turn, uncachedInputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 0 }
}

/**
 * Pure event fold: per-Turn sums of every billed attempt. Mirrors the Window
 * epoch's authority and dedup — a same-step sample is replaced by the final
 * usage, and a retried step is billed again — but Turn numbers never reset,
 * so entries survive compaction boundaries.
 * @param state - state covering all prior events.
 * @param incoming - the next committed Session event.
 * @returns the same state reference for every event that bills nothing.
 */
export function foldTurnUsage(state: TurnUsageState, incoming: unknown): TurnUsageState {
  const event = asRecord(incoming)
  if (!event) return state

  if (event.type === 'llm/retry-started') {
    const data = asRecord(event.data)
    if (data && state.last !== null
      && state.last.turn === data.turn && state.last.step === data.step) {
      return { ...state, last: null }
    }
    return state
  }

  if (event.type !== 'assistant/message' && event.type !== 'assistant/attempt') return state
  const data = asRecord(event.data)
  if (!data || !isCount(data.turn) || !isCount(data.step)) return state
  const usage = usageOfEvent(event)
  if (!usage) return state
  const previous = state.last !== null && state.last.turn === data.turn && state.last.step === data.step
    ? state.last.buckets : undefined
  if (previous !== undefined && equalTokenBuckets(previous, usage)) return state

  const current = state.entries.find(entry => entry.turn === data.turn) ?? zeroBuckets(data.turn)
  const merged: TurnUsageEntry = {
    turn: data.turn,
    uncachedInputTokens: current.uncachedInputTokens - (previous?.uncachedInputTokens ?? 0) + usage.uncachedInputTokens,
    cacheReadTokens: current.cacheReadTokens - (previous?.cacheReadTokens ?? 0) + usage.cacheReadTokens,
    cacheWriteTokens: current.cacheWriteTokens - (previous?.cacheWriteTokens ?? 0) + usage.cacheWriteTokens,
    outputTokens: current.outputTokens - (previous?.outputTokens ?? 0) + usage.outputTokens,
  }
  return {
    entries: state.entries.some(entry => entry.turn === data.turn)
      ? state.entries.map(entry => entry.turn === data.turn ? merged : entry)
      : [...state.entries, merged],
    last: { turn: data.turn, step: data.step, buckets: usage },
  }
}

export const turnUsageProjectionDefinition = {
  key: 'statusbarTurnUsage',
  stateVersion: 1,
  stateSchema,
  init: initialTurnUsage,
  apply: foldTurnUsage,
  wire: {
    viewSchema: z.array(entrySchema),
    summary: false,
    view: (state: TurnUsageState): TurnUsageEntry[] => state.entries,
  },
}
