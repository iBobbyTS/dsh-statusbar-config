/**
 * Replayable token accounting since the last successful compaction.
 * The Session cumulative usage continues to come from DSH's tokenUsage.
 */
import { z } from 'zod'

const bucketsSchema = z.object({
  uncachedInputTokens: z.number().int().nonnegative(),
  cacheReadTokens: z.number().int().nonnegative(),
  cacheWriteTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
}).strict()

const viewSchema = bucketsSchema.extend({
  compactionCount: z.number().int().nonnegative(),
}).strict()

const stateSchema = z.object({
  window: viewSchema,
  last: z.object({
    turn: z.number().int().nonnegative(),
    step: z.number().int().nonnegative(),
    buckets: bucketsSchema,
  }).nullable(),
}).strict()

export type TokenBuckets = z.infer<typeof bucketsSchema>
export type WindowUsageView = z.infer<typeof viewSchema>
export type WindowUsageState = z.infer<typeof stateSchema>

function emptyBuckets(): TokenBuckets {
  return { uncachedInputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 0 }
}

export function initialWindowUsage(): WindowUsageState {
  return { window: { ...emptyBuckets(), compactionCount: 0 }, last: null }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : undefined
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function bucketsFrom(raw: unknown): TokenBuckets | undefined {
  const usage = asRecord(raw)
  if (!usage || !isCount(usage.inputTokens) || !isCount(usage.outputTokens)) return
  if (usage.cacheReadTokens !== undefined && !isCount(usage.cacheReadTokens)) return
  if (usage.cacheWriteTokens !== undefined && !isCount(usage.cacheWriteTokens)) return
  return {
    uncachedInputTokens: usage.inputTokens,
    cacheReadTokens: usage.cacheReadTokens ?? 0,
    cacheWriteTokens: usage.cacheWriteTokens ?? 0,
    outputTokens: usage.outputTokens,
  }
}

/** Match token-meter's assistant/message authority and compact stream reader. */
function usageOf(event: Record<string, unknown>): TokenBuckets | undefined {
  if (event.type !== 'assistant/message' && event.type !== 'assistant/attempt') return
  const data = asRecord(event.data)
  if (!data) return
  if (event.type === 'assistant/message' && data.usage !== undefined) return bucketsFrom(data.usage)
  const stream = data.stream
  if (!Array.isArray(stream)) return
  for (let i = stream.length - 1; i >= 0; i--) {
    const member = asRecord(stream[i])
    if (member?.type !== 'chunk') continue
    const chunk = asRecord(member.chunk)
    if (chunk?.type === 'usage') return bucketsFrom(chunk.usage)
  }
  return
}

function equal(a: TokenBuckets, b: TokenBuckets): boolean {
  return a.uncachedInputTokens === b.uncachedInputTokens
    && a.cacheReadTokens === b.cacheReadTokens
    && a.cacheWriteTokens === b.cacheWriteTokens
    && a.outputTokens === b.outputTokens
}

/** Pure event fold; persisted Session logs rebuild historic Window epochs. */
export function foldWindowUsage(state: WindowUsageState, incoming: unknown): WindowUsageState {
  const event = asRecord(incoming)
  if (!event) return state
  const data = asRecord(event.data)

  if (event.type === 'compaction/end') {
    // Failed/aborted compaction is not a window boundary.
    if (!data || data.error !== undefined) return state
    return {
      window: { ...emptyBuckets(), compactionCount: state.window.compactionCount + 1 },
      last: null,
    }
  }

  if (event.type === 'llm/retry-started') {
    if (data && state.last !== null
      && state.last.turn === data.turn && state.last.step === data.step) {
      return { ...state, last: null }
    }
    return state
  }

  if (event.type !== 'assistant/message' && event.type !== 'assistant/attempt') return state
  if (!data || !isCount(data.turn) || !isCount(data.step)) return state
  const usage = usageOf(event)
  if (!usage) return state
  const previous = state.last !== null && state.last.turn === data.turn && state.last.step === data.step
    ? state.last.buckets : undefined
  if (previous && equal(previous, usage)) return state

  return {
    window: {
      uncachedInputTokens: state.window.uncachedInputTokens - (previous?.uncachedInputTokens ?? 0) + usage.uncachedInputTokens,
      cacheReadTokens: state.window.cacheReadTokens - (previous?.cacheReadTokens ?? 0) + usage.cacheReadTokens,
      cacheWriteTokens: state.window.cacheWriteTokens - (previous?.cacheWriteTokens ?? 0) + usage.cacheWriteTokens,
      outputTokens: state.window.outputTokens - (previous?.outputTokens ?? 0) + usage.outputTokens,
      compactionCount: state.window.compactionCount,
    },
    last: { turn: data.turn, step: data.step, buckets: usage },
  }
}

export const windowUsageProjectionDefinition = {
  key: 'statusbarWindowUsage',
  stateVersion: 1,
  stateSchema,
  init: initialWindowUsage,
  apply: foldWindowUsage,
  wire: {
    viewSchema,
    summary: false,
    view: (state: WindowUsageState): WindowUsageView => state.window,
  },
}

/** Local typed Cordis service seam, without a runtime import from DSH internals. */
declare module '@deepseek-ai/cordis' {
  interface Context {
    sessionProjections: {
      register(definition: typeof windowUsageProjectionDefinition): Promise<unknown>
    }
  }
}
