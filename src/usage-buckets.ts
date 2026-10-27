/**
 * Provider-reported Token buckets, shared by the Host projections.
 *
 * DSH reports prompt input split into uncached input, cache reads and cache
 * writes plus output; the footer, the Window epoch and the compaction marker
 * all start from this one shape so a provider that omits a bucket keeps
 * meaning "not reported" instead of "zero".
 */
import { z } from 'zod'

export const bucketsSchema = z.object({
  uncachedInputTokens: z.number().int().nonnegative(),
  cacheReadTokens: z.number().int().nonnegative(),
  cacheWriteTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
}).strict()

export type TokenBuckets = z.infer<typeof bucketsSchema>

export function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : undefined
}

export function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

/** Read one provider `usage` payload; a missing bucket is normalized to zero. */
export function bucketsFrom(raw: unknown): TokenBuckets | undefined {
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
