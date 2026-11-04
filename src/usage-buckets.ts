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

/**
 * Read one committed assistant event's reported usage, matching token-meter's
 * assistant/message authority and compact stream reader; a missing bucket is
 * normalized to zero.
 */
export function usageOfEvent(event: Record<string, unknown>): TokenBuckets | undefined {
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

/** Structural bucket equality for the replace-vs-add fold seams. */
export function equalTokenBuckets(a: TokenBuckets, b: TokenBuckets): boolean {
  return a.uncachedInputTokens === b.uncachedInputTokens
    && a.cacheReadTokens === b.cacheReadTokens
    && a.cacheWriteTokens === b.cacheWriteTokens
    && a.outputTokens === b.outputTokens
}
