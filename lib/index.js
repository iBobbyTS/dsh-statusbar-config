import Schema from "@deepseek-ai/schemastery";
import { z } from "zod";
//#region src/settings.ts
/**
* Shared settings contract between the Host half (namespace registration)
* and the browser half (scope binding + card).
*
* The namespace deliberately reuses the historical `status-bar-config` value
* so pre-template sections in `~/.dsh/settings.yaml` keep loading (unknown
* legacy keys are ignored).
*/
const SETTINGS_NAMESPACE_VALUE = "status-bar-config";
const PREVIOUS_DEFAULT_TEMPLATE = "↩ ${cacheRead} · ↑ ${uncachedInput} · ↓ ${output}";
const LEGACY_DUAL_DEFAULT_TEMPLATE = "↩ /↑/↓ | Session: ${cacheRead}/${uncachedInput}/${output} | Window: ${windowCacheRead}/${windowUncachedInput}/${windowOutput}";
const SPACED_DUAL_DEFAULT_TEMPLATE = "↩ / ↑ / ↓ | Session: ${cacheRead}/${uncachedInput}/${output} | Window: ${windowCacheRead}/${windowUncachedInput}/${windowOutput}";
const DEFAULT_SETTINGS = Object.freeze({
	enabled: true,
	template: "Session: ${cacheRead}/${uncachedInput}/${output} | Window: ${windowCacheRead}/${windowUncachedInput}/${windowOutput}"
});
//#endregion
function resolveUsageTemplate(template) { const value = template.trim(); return value === PREVIOUS_DEFAULT_TEMPLATE || value === LEGACY_DUAL_DEFAULT_TEMPLATE || value === SPACED_DUAL_DEFAULT_TEMPLATE ? DEFAULT_SETTINGS.template : template; }
//#region src/window-usage.ts
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





function emptyBuckets() {
  return { uncachedInputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 0 }
}

function initialWindowUsage() {
  return { window: { ...emptyBuckets(), compactionCount: 0 }, last: null }
}

function asRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value : undefined
}

function isCount(value) {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function bucketsFrom(raw) {
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
function usageOf(event) {
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

function equal(a, b) {
  return a.uncachedInputTokens === b.uncachedInputTokens
    && a.cacheReadTokens === b.cacheReadTokens
    && a.cacheWriteTokens === b.cacheWriteTokens
    && a.outputTokens === b.outputTokens
}

/** Pure event fold; persisted Session logs rebuild historic Window epochs. */
function foldWindowUsage(state, incoming) {
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

const windowUsageProjectionDefinition = {
  key: 'statusbarWindowUsage',
  stateVersion: 1,
  stateSchema,
  init: initialWindowUsage,
  apply: foldWindowUsage,
  wire: {
    viewSchema,
    summary: false,
    view: (state) => state.window,
  },
}


//#endregion
//#region src/index.ts
const name = "dsh-statusbar-config";
const Config = Schema.object({
	enabled: Schema.boolean().default(DEFAULT_SETTINGS.enabled).description("Display the configurable statistics row below the composer."),
	template: Schema.string().default(DEFAULT_SETTINGS.template).role("textarea").description("Display template with ${variable} placeholders; empty = default statistics row. Variables: ${turns} ${steps} ${llm} ${tool} ${ttft} ${tps} ${cache} ${input} ${output} ${cacheRead} ${uncachedInput} ${cacheWrite} ${total} ${windowCacheRead} ${windowUncachedInput} ${windowCacheWrite} ${windowOutput} ${windowTotal}.")
});
function apply(ctx, config) {
  ctx.inject(["sessionProjections"], async scoped => {
    await scoped.sessionProjections.register(windowUsageProjectionDefinition);
  });
	ctx.inject(["settings"], (settingsCtx) => {
		settingsCtx.settings.register(SETTINGS_NAMESPACE_VALUE, Config, {
			base: config,
			applies: "live"
		});
	});
}
//#endregion
export { Config, apply, name };

//# sourceMappingURL=index.js.map
