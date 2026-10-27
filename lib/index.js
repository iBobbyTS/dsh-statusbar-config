import Schema from "@deepseek-ai/schemastery";
import { z } from "zod";
//#region src/settings.ts
const DEFAULT_SETTINGS = Object.freeze({
	enabled: true,
	template: "Session: ${cacheRead}/${uncachedInput}/${output} | Window: ${windowCacheRead}/${windowUncachedInput}/${windowOutput}"
});
//#endregion
//#region src/usage-buckets.ts
/**
* Provider-reported Token buckets, shared by the Host projections.
*
* DSH reports prompt input split into uncached input, cache reads and cache
* writes plus output; the footer, the Window epoch and the compaction marker
* all start from this one shape so a provider that omits a bucket keeps
* meaning "not reported" instead of "zero".
*/
const bucketsSchema = z.object({
	uncachedInputTokens: z.number().int().nonnegative(),
	cacheReadTokens: z.number().int().nonnegative(),
	cacheWriteTokens: z.number().int().nonnegative(),
	outputTokens: z.number().int().nonnegative()
}).strict();
function asRecord(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
function isCount(value) {
	return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
/** Read one provider `usage` payload; a missing bucket is normalized to zero. */
function bucketsFrom(raw) {
	const usage = asRecord(raw);
	if (!usage || !isCount(usage.inputTokens) || !isCount(usage.outputTokens)) return;
	if (usage.cacheReadTokens !== void 0 && !isCount(usage.cacheReadTokens)) return;
	if (usage.cacheWriteTokens !== void 0 && !isCount(usage.cacheWriteTokens)) return;
	return {
		uncachedInputTokens: usage.inputTokens,
		cacheReadTokens: usage.cacheReadTokens ?? 0,
		cacheWriteTokens: usage.cacheWriteTokens ?? 0,
		outputTokens: usage.outputTokens
	};
}
//#endregion
//#region src/compaction-usage.ts
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
	outputTokens: z.number().int().nonnegative()
}).strict();
const viewSchema$1 = z.array(entrySchema);
const stateSchema$1 = z.object({ entries: z.array(entrySchema) }).strict();
function initialCompactionUsage() {
	return { entries: [] };
}
/**
* Pure event fold: one entry per `compaction/summary` that reports both the
* replaced-history counts and the summarizer usage.
* @param state - state covering all prior events.
* @param incoming - the next committed Session event.
* @returns the same state reference for every unrelated event.
*/
function foldCompactionUsage(state, incoming) {
	const event = asRecord(incoming);
	if (event?.type !== "compaction/summary") return state;
	if (!isCount(event.seq)) return state;
	if (state.entries.some((entry) => entry.seq === event.seq)) return state;
	const data = asRecord(event.data);
	if (!data) return state;
	if (!Array.isArray(data.shadowedSeqs) || !isCount(data.shadowedTokenCount)) return state;
	const usage = bucketsFrom(data.usage);
	if (usage === void 0) return state;
	const entry = {
		seq: event.seq,
		items: data.shadowedSeqs.length,
		tokens: data.shadowedTokenCount,
		inputTokens: usage.uncachedInputTokens + usage.cacheReadTokens + usage.cacheWriteTokens,
		outputTokens: usage.outputTokens
	};
	return { entries: [...state.entries, entry].slice(-32) };
}
const compactionUsageProjectionDefinition = {
	key: "statusbarCompactionUsage",
	stateVersion: 1,
	stateSchema: stateSchema$1,
	init: initialCompactionUsage,
	apply: foldCompactionUsage,
	wire: {
		viewSchema: viewSchema$1,
		summary: false,
		view: (state) => state.entries
	}
};
//#endregion
//#region src/window-usage.ts
/**
* Replayable token accounting since the last successful compaction.
* The Session cumulative usage continues to come from DSH's tokenUsage.
*/
const viewSchema = bucketsSchema.extend({ compactionCount: z.number().int().nonnegative() }).strict();
const stateSchema = z.object({
	window: viewSchema,
	last: z.object({
		turn: z.number().int().nonnegative(),
		step: z.number().int().nonnegative(),
		buckets: bucketsSchema
	}).nullable()
}).strict();
function emptyBuckets() {
	return {
		uncachedInputTokens: 0,
		cacheReadTokens: 0,
		cacheWriteTokens: 0,
		outputTokens: 0
	};
}
function initialWindowUsage() {
	return {
		window: {
			...emptyBuckets(),
			compactionCount: 0
		},
		last: null
	};
}
/** Match token-meter's assistant/message authority and compact stream reader. */
function usageOf(event) {
	if (event.type !== "assistant/message" && event.type !== "assistant/attempt") return;
	const data = asRecord(event.data);
	if (!data) return;
	if (event.type === "assistant/message" && data.usage !== void 0) return bucketsFrom(data.usage);
	const stream = data.stream;
	if (!Array.isArray(stream)) return;
	for (let i = stream.length - 1; i >= 0; i--) {
		const member = asRecord(stream[i]);
		if (member?.type !== "chunk") continue;
		const chunk = asRecord(member.chunk);
		if (chunk?.type === "usage") return bucketsFrom(chunk.usage);
	}
}
function equal(a, b) {
	return a.uncachedInputTokens === b.uncachedInputTokens && a.cacheReadTokens === b.cacheReadTokens && a.cacheWriteTokens === b.cacheWriteTokens && a.outputTokens === b.outputTokens;
}
/** Pure event fold; persisted Session logs rebuild historic Window epochs. */
function foldWindowUsage(state, incoming) {
	const event = asRecord(incoming);
	if (!event) return state;
	const data = asRecord(event.data);
	if (event.type === "compaction/end") {
		if (!data || data.error !== void 0) return state;
		return {
			window: {
				...emptyBuckets(),
				compactionCount: state.window.compactionCount + 1
			},
			last: null
		};
	}
	if (event.type === "llm/retry-started") {
		if (data && state.last !== null && state.last.turn === data.turn && state.last.step === data.step) return {
			...state,
			last: null
		};
		return state;
	}
	if (event.type !== "assistant/message" && event.type !== "assistant/attempt") return state;
	if (!data || !isCount(data.turn) || !isCount(data.step)) return state;
	const usage = usageOf(event);
	if (!usage) return state;
	const previous = state.last !== null && state.last.turn === data.turn && state.last.step === data.step ? state.last.buckets : void 0;
	if (previous && equal(previous, usage)) return state;
	return {
		window: {
			uncachedInputTokens: state.window.uncachedInputTokens - (previous?.uncachedInputTokens ?? 0) + usage.uncachedInputTokens,
			cacheReadTokens: state.window.cacheReadTokens - (previous?.cacheReadTokens ?? 0) + usage.cacheReadTokens,
			cacheWriteTokens: state.window.cacheWriteTokens - (previous?.cacheWriteTokens ?? 0) + usage.cacheWriteTokens,
			outputTokens: state.window.outputTokens - (previous?.outputTokens ?? 0) + usage.outputTokens,
			compactionCount: state.window.compactionCount
		},
		last: {
			turn: data.turn,
			step: data.step,
			buckets: usage
		}
	};
}
const windowUsageProjectionDefinition = {
	key: "statusbarWindowUsage",
	stateVersion: 1,
	stateSchema,
	init: initialWindowUsage,
	apply: foldWindowUsage,
	wire: {
		viewSchema,
		summary: false,
		view: (state) => state.window
	}
};
//#endregion
//#region src/index.ts
const name = "dsh-statusbar-config";
const Config = Schema.object({
	enabled: Schema.boolean().default(DEFAULT_SETTINGS.enabled).description("Display the configurable statistics row below the composer.").volatile(),
	template: Schema.string().default(DEFAULT_SETTINGS.template).role("textarea").description("Display template with ${variable} placeholders; empty = default statistics row. Variables: ${turns} ${steps} ${llm} ${tool} ${ttft} ${tps} ${cache} ${input} ${output} ${cacheRead} ${uncachedInput} ${cacheWrite} ${total} ${windowCacheRead} ${windowUncachedInput} ${windowCacheWrite} ${windowOutput} ${windowTotal}.").volatile()
});
function apply(ctx) {
	ctx.inject(["sessionProjections"], async (scoped) => {
		await scoped.sessionProjections.register(windowUsageProjectionDefinition);
		await scoped.sessionProjections.register(compactionUsageProjectionDefinition);
	});
}
//#endregion
export { Config, apply, name };

//# sourceMappingURL=index.js.map