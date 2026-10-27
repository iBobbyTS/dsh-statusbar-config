window.__ModuleLoader__.load({
	id: "dsh-statusbar-config",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		const DEFAULT_SETTINGS = Object.freeze({
			enabled: true,
			template: "Session: ${cacheRead}/${uncachedInput}/${output} | Window: ${windowCacheRead}/${windowUncachedInput}/${windowOutput}"
		});
		/** Upgrade the shipped default without overwriting unrelated custom templates. */
		function resolveUsageTemplate(template) {
			const value = template.trim();
			return value === "↩ ${cacheRead} · ↑ ${uncachedInput} · ↓ ${output}" || value === "↩ /↑/↓ | Session: ${cacheRead}/${uncachedInput}/${output} | Window: ${windowCacheRead}/${windowUncachedInput}/${windowOutput}" || value === "↩ / ↑ / ↓ | Session: ${cacheRead}/${uncachedInput}/${output} | Window: ${windowCacheRead}/${windowUncachedInput}/${windowOutput}" ? DEFAULT_SETTINGS.template : template;
		}
		//#endregion
		//#region src/client/SettingsCard.tsx
		/** Clickable variable chips, most-useful first. */
		const VARIABLES = [
			"cacheRead",
			"uncachedInput",
			"output",
			"windowCacheRead",
			"windowUncachedInput",
			"windowOutput",
			"cacheWrite",
			"windowCacheWrite",
			"input",
			"total",
			"windowTotal",
			"cache",
			"ttft",
			"tps",
			"turns",
			"steps",
			"llm",
			"tool"
		];
		function StatusbarSettingsCard({ settings, t }) {
			const snapshot = (0, react.useSyncExternalStore)((listener) => settings.subscribe(listener), () => settings.getSnapshot(), () => settings.getSnapshot());
			const [open, setOpen] = (0, react.useState)(false);
			const [busy, setBusy] = (0, react.useState)();
			const [notice, setNotice] = (0, react.useState)();
			/** Local draft while editing; null = show the stored value. */
			const [draft, setDraft] = (0, react.useState)(null);
			const inputRef = (0, react.useRef)(null);
			const stored = snapshot.value ?? DEFAULT_SETTINGS;
			const shown = draft ?? resolveUsageTemplate(stored.template);
			const writable = snapshot.status === "ready" && snapshot.writable;
			const update = async (key, next) => {
				setBusy(key);
				setNotice(void 0);
				try {
					await settings.set(key, next);
					setNotice({
						kind: "success",
						text: t("card.saved")
					});
				} catch (cause) {
					setNotice({
						kind: "error",
						text: cause instanceof Error ? cause.message : String(cause)
					});
				} finally {
					setBusy(void 0);
				}
			};
			const commitTemplate = async () => {
				if (draft === null) return;
				const value = draft;
				setDraft(null);
				if (value === stored.template) return;
				await update("template", value);
			};
			/** Clamp the tooltip inside the card so it never clips at either dialog edge. */
			const positionTip = (event) => {
				const chip = event.currentTarget;
				const anchor = chip.closest(".dsc-card");
				if (anchor === null) return;
				const tipWidth = parseFloat(getComputedStyle(chip, "::after").width);
				if (!Number.isFinite(tipWidth) || tipWidth <= 0) return;
				const chipRect = chip.getBoundingClientRect();
				const anchorRect = anchor.getBoundingClientRect();
				const lower = anchorRect.left - chipRect.left;
				const upper = anchorRect.right - chipRect.left - tipWidth - 8;
				const left = Math.max(lower, Math.min(0, upper));
				chip.style.setProperty("--tip-left", `${Math.round(left)}px`);
			};
			const insertVariable = (name) => {
				const token = "${" + name + "}";
				const input = inputRef.current;
				const base = draft ?? resolveUsageTemplate(stored.template);
				if (input === null) {
					setDraft(base + token);
					return;
				}
				const start = input.selectionStart ?? base.length;
				const end = input.selectionEnd ?? base.length;
				setDraft(base.slice(0, start) + token + base.slice(end));
				requestAnimationFrame(() => {
					input.focus();
					const caret = start + token.length;
					input.setSelectionRange(caret, caret);
				});
			};
			const reset = async () => {
				setBusy("reset");
				setNotice(void 0);
				setDraft(null);
				try {
					for (const key of ["enabled", "template"]) await settings.unset(key);
					setNotice({
						kind: "success",
						text: t("card.resetDone")
					});
				} catch (cause) {
					setNotice({
						kind: "error",
						text: cause instanceof Error ? cause.message : String(cause)
					});
				} finally {
					setBusy(void 0);
				}
			};
			const statusText = notice?.text ?? (snapshot.status === "loading" ? t("card.loading") : snapshot.status === "ready" ? snapshot.writable ? t("card.live") : t("card.readonly") : t("card.unavailable"));
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
				className: "dsc-card",
				"data-open": open,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "dsc-card-header",
					"aria-expanded": open,
					onClick: () => setOpen((current) => !current),
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: "dsc-card-heading",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dsc-card-title",
							children: t("card.title")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dsc-card-description",
							children: t("card.description")
						})]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
						className: "dsc-card-chevron",
						viewBox: "0 0 16 16",
						fill: "none",
						"aria-hidden": "true",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
							d: "m4 6 4 4 4-4",
							stroke: "currentColor",
							strokeWidth: "1.5",
							strokeLinecap: "round",
							strokeLinejoin: "round"
						})
					})]
				}), open && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dsc-card-body",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsc-row",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								className: "dsc-copy",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsc-label",
									children: t("card.enabled")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsc-hint",
									children: t("card.enabledHint")
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: "dsc-toggle",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: stored.enabled,
									disabled: !writable || busy !== void 0,
									onChange: (event) => {
										update("enabled", event.currentTarget.checked);
									}
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsc-switch",
									"aria-hidden": "true"
								})]
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsc-row dsc-template-row",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dsc-copy",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										ref: inputRef,
										type: "text",
										className: "dsc-input",
										value: shown,
										placeholder: t("card.templateExample"),
										spellCheck: false,
										disabled: !writable || busy !== void 0,
										onChange: (event) => setDraft(event.currentTarget.value),
										onBlur: () => {
											commitTemplate();
										},
										onKeyDown: (event) => {
											if (event.key === "Enter") event.currentTarget.blur();
										}
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dsc-chips",
										role: "group",
										"aria-label": t("card.chipsLabel"),
										children: VARIABLES.map((name) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "dsc-chip",
											"data-tip": t(`var.${name}`),
											"aria-label": `\${${name}} — ${t(`var.${name}`)}`,
											onMouseEnter: positionTip,
											onFocus: positionTip,
											disabled: !writable || busy !== void 0,
											onClick: () => insertVariable(name),
											children: ` \${${name}}`
										}, name))
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dsc-hint",
										children: t("card.templateSave")
									})
								]
							})
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsc-footer",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dsc-footer-copy",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsc-status",
									"data-kind": notice?.kind,
									role: notice?.kind === "error" ? "alert" : "status",
									"aria-live": notice?.kind === "error" ? "assertive" : "polite",
									children: statusText
								})
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dsc-button",
								disabled: !writable || busy !== void 0,
								onClick: () => {
									reset();
								},
								children: t("card.reset")
							})]
						})
					]
				})]
			});
		}
		//#endregion
		//#region src/client/locales.ts
		const LOCALE_NAMESPACE = "dsh-statusbar-config";
		const en = {
			"stats.counts": "{turns} turns · {steps} steps",
			"stats.turns": "{turns} turns",
			"stats.steps": "{steps} steps",
			"stats.llm": "LLM {duration}",
			"stats.toolCall": "Tool call {duration}",
			"stats.ttftAverage": "TTFT avg {duration}",
			"stats.tokensPerSecond": "{throughput} tok/s",
			"stats.cacheHit": "Cache hit {percent}%",
			"stats.tokens": "Input {input} tok · Output {output} tok",
			"stats.inputTokens": "Input {input} tok",
			"stats.outputTokens": "Output {output} tok",
			"card.title": "Status bar template",
			"card.description": "Customize session and current-window token usage below the composer.",
			"card.enabled": "Show statistics row",
			"card.enabledHint": "Display the statistics strip below the composer.",
			"card.template": "Display template",
			"card.templateHint": "Empty = default statistics row. Variables: ${turns} ${steps} ${llm} ${tool} ${ttft} ${tps} ${cache} ${input} ${output} — units are yours to write, e.g. ${ttft}s · ${tps} tok/s.",
			"card.templateExample": "Session: ${cacheRead}/${uncachedInput}/${output} | Window: ${windowCacheRead}/${windowUncachedInput}/${windowOutput}",
			"card.templateSave": "Click a variable to insert it at the cursor. Press Enter or click away to save — applies immediately.",
			"card.chipsLabel": "Insert variable",
			"var.ttft": "Average time to first token, seconds — bare number, you write the unit. e.g. 5.8",
			"var.tps": "Decode throughput in tokens/second — bare number. e.g. 69",
			"var.cache": "Prompt cache hit percent, no % sign. e.g. 93",
			"var.input": "All prompt input, including cache reads/writes. e.g. 63.7M",
			"var.cacheRead": "Cache read input. e.g. 59.3M",
			"var.uncachedInput": "Uncached input. e.g. 4.4M",
			"var.cacheWrite": "Cache write input. e.g. 20K",
			"var.total": "Input plus output tokens. e.g. 63.9M",
			"var.windowCacheRead": "Cache reads since successful compaction.",
			"var.windowUncachedInput": "Uncached input since successful compaction.",
			"var.windowCacheWrite": "Cache writes since successful compaction.",
			"var.windowOutput": "Output since successful compaction.",
			"var.windowTotal": "Billed tokens since successful compaction.",
			"var.output": "Generated output tokens, compact format. e.g. 178K",
			"var.turns": "Completed conversation turns. e.g. 12",
			"var.steps": "Completed agent steps. e.g. 34",
			"var.llm": "Cumulative model wall time, unit included. e.g. 3m12s",
			"var.tool": "Cumulative tool-call time, unit included. e.g. 1m8s",
			"stats.usageTitle": "Session token usage",
			"stats.windowTitle": "Current window usage",
			"stats.usageCacheRead": "Cache read",
			"stats.usageUncached": "Uncached input",
			"stats.usageCacheWrite": "Cache write",
			"stats.usageOutput": "Output",
			"stats.usageCacheHit": "Cache hit",
			"card.saved": "Saved. The statistics row updated immediately.",
			"card.resetDone": "Restored the default statistics row.",
			"card.loading": "Loading settings…",
			"card.live": "Changes apply immediately.",
			"card.readonly": "Settings are read-only in this runtime.",
			"card.unavailable": "The status bar settings namespace is unavailable.",
			"card.reset": "Restore defaults"
		};
		const zh = {
			"stats.counts": "{turns} 轮 · {steps} 步",
			"stats.turns": "{turns} 轮",
			"stats.steps": "{steps} 步",
			"stats.llm": "LLM {duration}",
			"stats.toolCall": "工具调用 {duration}",
			"stats.ttftAverage": "首 token 平均 {duration}",
			"stats.tokensPerSecond": "{throughput} tok/s",
			"stats.cacheHit": "缓存命中 {percent}%",
			"stats.tokens": "输入 {input} tok · 输出 {output} tok",
			"stats.inputTokens": "输入 {input} tok",
			"stats.outputTokens": "输出 {output} tok",
			"card.title": "状态栏模板",
			"card.description": "自定义输入框下方的会话与当前窗口 Token 用量。",
			"card.enabled": "显示统计行",
			"card.enabledHint": "在输入框下方显示统计条。",
			"card.template": "显示模板",
			"card.templateHint": "留空使用默认统计行。变量：${turns} ${steps} ${llm} ${tool} ${ttft} ${tps} ${cache} ${input} ${output}——单位自己写，如 ${ttft}s · ${tps} tok/s。",
			"card.templateExample": "会话: ${cacheRead}/${uncachedInput}/${output} | 窗口: ${windowCacheRead}/${windowUncachedInput}/${windowOutput}",
			"card.templateSave": "点变量插入到光标处，回车或点空白处保存，即时生效。",
			"card.chipsLabel": "插入变量",
			"var.ttft": "首 token 平均耗时（秒）——纯数字，单位自己写。示例: 5.8",
			"var.tps": "解码速度（tok/s）——纯数字。示例: 69",
			"var.cache": "缓存命中率——不带 % 号。示例: 93",
			"var.input": "全部输入 token，包含缓存读写。示例：63.7M",
			"var.cacheRead": "缓存读取。示例：59.3M",
			"var.uncachedInput": "未缓存输入。示例：4.4M",
			"var.cacheWrite": "缓存写入。示例：20K",
			"var.total": "输入与输出合计。示例：63.9M",
			"var.windowCacheRead": "最近成功压缩后的缓存读取",
			"var.windowUncachedInput": "最近成功压缩后的未缓存输入",
			"var.windowCacheWrite": "最近成功压缩后的缓存写入",
			"var.windowOutput": "最近成功压缩后的模型输出",
			"var.windowTotal": "最近成功压缩后的计费 Token 总量",
			"var.output": "输出 token（紧凑格式）。示例: 178K",
			"var.turns": "已完成对话轮数。示例: 12",
			"var.steps": "已完成 agent 步数。示例: 34",
			"var.llm": "模型累计耗时，自带单位。示例: 3m12s",
			"var.tool": "工具调用累计耗时，自带单位。示例: 1m8s",
			"stats.usageTitle": "会话累计用量",
			"stats.windowTitle": "当前窗口用量",
			"stats.usageCacheRead": "缓存读取",
			"stats.usageUncached": "未缓存输入",
			"stats.usageCacheWrite": "缓存写入",
			"stats.usageOutput": "输出",
			"stats.usageCacheHit": "缓存命中率",
			"card.saved": "已保存，统计行已即时更新。",
			"card.resetDone": "已恢复默认统计行。",
			"card.loading": "正在加载设置…",
			"card.live": "更改即时生效。",
			"card.readonly": "当前运行时中设置为只读。",
			"card.unavailable": "状态栏设置命名空间不可用。",
			"card.reset": "恢复默认"
		};
		Object.freeze({
			turns: true,
			steps: true,
			llmTime: true,
			toolTime: true,
			ttft: true,
			throughput: true,
			cacheHit: true,
			inputTokens: true,
			outputTokens: true
		});
		function formatTokens(value) {
			const scaled = (item) => item >= 100 ? String(Math.round(item)) : String(Math.round(item * 10) / 10);
			if (value < 1e3) return String(value);
			if (value < 1e6) return `${scaled(value / 1e3)}K`;
			return `${scaled(value / 1e6)}M`;
		}
		function formatDuration(ms) {
			const seconds = ms / 1e3;
			if (seconds < 60) return `${Math.round(seconds * 10) / 10}s`;
			const whole = Math.round(seconds);
			return `${Math.floor(whole / 60)}m${whole % 60}s`;
		}
		function formatTokensPerSecond(value) {
			const clamped = Math.max(0, value);
			return clamped >= 10 ? String(Math.round(clamped)) : String(Math.round(clamped * 10) / 10);
		}
		/** Bare seconds number for template placeholders: "5.8" under a minute, "102" above. */
		function formatSecondsNumber(ms) {
			const seconds = ms / 1e3;
			if (seconds < 60) return String(Math.round(seconds * 10) / 10);
			return String(Math.round(seconds));
		}
		function billedInputTokens(usage) {
			return usage.uncachedInputTokens + usage.cacheReadTokens + usage.cacheWriteTokens;
		}
		function roundedIntegerPercent(cacheReadTokens, denominator) {
			const denominatorQuotient = Math.floor(denominator / 200);
			const denominatorRemainder = denominator % 200;
			let lower = 0;
			let upper = 100;
			while (lower < upper) {
				const candidate = Math.floor((lower + upper + 1) / 2);
				const factor = candidate * 2 - 1;
				if (cacheReadTokens >= factor * denominatorQuotient + Math.ceil(factor * denominatorRemainder / 200)) lower = candidate;
				else upper = candidate - 1;
			}
			return lower;
		}
		function cacheHitPercent(usage) {
			const denominator = billedInputTokens(usage);
			if (denominator === 0) return null;
			const missedInputTokens = usage.uncachedInputTokens + usage.cacheWriteTokens;
			if (missedInputTokens === 0) return "100";
			const integerPercent = roundedIntegerPercent(usage.cacheReadTokens, denominator);
			if (integerPercent < 100) return String(integerPercent);
			let decimalPlaces = 1;
			let scaledDoubleGap = missedInputTokens * 200;
			const denominatorTens = Math.floor(denominator / 10);
			while (scaledDoubleGap <= denominatorTens) {
				scaledDoubleGap *= 10;
				decimalPlaces += 1;
			}
			const denominatorOnes = denominator % 10;
			let roundedLoss = 5;
			for (let loss = 1; loss < 5; loss += 1) {
				const factor = loss * 2 + 1;
				const threshold = factor * denominatorTens + Math.floor(factor * denominatorOnes / 10);
				if (scaledDoubleGap <= threshold) {
					roundedLoss = loss;
					break;
				}
			}
			return `99.${"9".repeat(decimalPlaces - 1)}${10 - roundedLoss}`;
		}
		function usageOutputTokens(usage) {
			if (typeof usage !== "object" || usage === null) return null;
			const value = usage.outputTokens;
			return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
		}
		/**
		* Fold assistant and tool-result nodes into window-scoped display totals —
		* the FALLBACK for assemblies without the `sessionStats` projection.
		*/
		function deriveStats(nodes) {
			const turns = /* @__PURE__ */ new Set();
			let steps = 0;
			let llmMs = 0;
			let toolMs = 0;
			let ttftMs = 0;
			let ttftSteps = 0;
			let decodeMs = 0;
			let decodeTokens = 0;
			for (const node of nodes) {
				if (node.kind === "tool-result") {
					if (node.callTime != null) toolMs += Math.max(0, node.time - node.callTime);
					continue;
				}
				if (node.kind !== "assistant") continue;
				turns.add(node.turn);
				steps += 1;
				const timing = node.timing;
				if (timing !== void 0 && timing.stepStartTime !== null) llmMs += Math.max(0, timing.completedTime - timing.stepStartTime);
				if (timing !== void 0 && timing.stepStartTime !== null && timing.firstTokenTime !== null) {
					ttftMs += Math.max(0, timing.firstTokenTime - timing.stepStartTime);
					ttftSteps += 1;
				}
				const outputTokens = usageOutputTokens(node.usage);
				if (timing !== void 0 && timing.firstTokenTime !== null && outputTokens !== null) {
					decodeMs += Math.max(0, timing.completedTime - timing.firstTokenTime);
					decodeTokens += outputTokens;
				}
			}
			return {
				turns: turns.size,
				steps,
				llmMs,
				toolMs,
				ttftMs,
				ttftSteps,
				decodeMs,
				decodeTokens
			};
		}
		/**
		* Render the user's display template (JS template-literal syntax `${var}`):
		* every `${variable}` placeholder is substituted with the current value;
		* unknown placeholders stay verbatim so typos are visible; unavailable values
		* (e.g. cache hit before any billed input) become empty strings.
		*
		* Variables: `${turns}` `${steps}` `${llm}` `${tool}` `${ttft}` `${tps}`
		* `${cache}` `${input}` `${output}`. Units live in the template: `${llm}`/
		* `${tool}` carry their own compact unit ("3m12s"), `${ttft}` and `${tps}`
		* are bare numbers ("5.8", "69"), `${cache}` is the percent integer ("93"),
		* `${input}`/`${output}` are compact token counts ("63.7M").
		*/
		/** Next-request context estimate, not a cumulative billed total. */
		function contextMeterReading(pressure) {
			const used = pressure?.projectedTokens ?? pressure?.pressureTokens;
			const capacity = pressure?.contextWindow;
			if (used === void 0 || capacity === void 0 || !Number.isFinite(used) || !Number.isFinite(capacity) || used < 0 || capacity <= 0) return null;
			return formatTokens(used) + " / " + formatTokens(capacity);
		}
		/** Collapse the stock two-interval display until this Session has a successful compaction. */
		function selectFooterTemplate(template, windowUsage) {
			return template === DEFAULT_SETTINGS.template && windowUsage?.compactionCount === 0 ? "${cacheRead}/${uncachedInput}/${output}" : template;
		}
		function renderTemplate(template, stats, usage, windowUsage) {
			const values = {};
			if (stats !== void 0) {
				values.turns = String(stats.turns);
				values.steps = String(stats.steps);
				values.llm = stats.llmMs > 0 ? formatDuration(stats.llmMs) : "";
				values.tool = stats.toolMs > 0 ? formatDuration(stats.toolMs) : "";
				values.ttft = stats.ttftSteps > 0 ? formatSecondsNumber(stats.ttftMs / stats.ttftSteps) : "";
				values.tps = stats.decodeMs > 0 ? formatTokensPerSecond(stats.decodeTokens / (stats.decodeMs / 1e3)) : "";
			}
			if (usage !== void 0) {
				values.cache = cacheHitPercent(usage) ?? "";
				values.input = formatTokens(billedInputTokens(usage));
				values.uncachedInput = formatTokens(usage.uncachedInputTokens);
				values.cacheRead = formatTokens(usage.cacheReadTokens);
				values.cacheWrite = formatTokens(usage.cacheWriteTokens);
				values.output = formatTokens(usage.outputTokens);
				values.total = formatTokens(billedInputTokens(usage) + usage.outputTokens);
			}
			values.windowCacheRead = windowUsage === void 0 ? "—" : formatTokens(windowUsage.cacheReadTokens);
			values.windowUncachedInput = windowUsage === void 0 ? "—" : formatTokens(windowUsage.uncachedInputTokens);
			values.windowCacheWrite = windowUsage === void 0 ? "—" : formatTokens(windowUsage.cacheWriteTokens);
			values.windowOutput = windowUsage === void 0 ? "—" : formatTokens(windowUsage.outputTokens);
			values.windowTotal = windowUsage === void 0 ? "—" : formatTokens(billedInputTokens(windowUsage) + windowUsage.outputTokens);
			return template.replace(/\$\{([a-zA-Z]+)\}/g, (whole, name) => {
				return name in values ? values[name] : whole;
			});
		}
		//#endregion
		//#region src/client/compaction-label.ts
		/**
		* Compaction marker label: the shipped `/compact` and automatic-compaction
		* rows print the estimated size of the replaced history
		* (`已压缩 709 条历史记录（约 413235 tokens）`). This swaps only that summary
		* text for the summarization call's own `所有输入之和 → 输出` Token usage.
		*
		* There is a `conversation.chat.commandview` Slot keyed by command name, but
		* replacing the row would re-own the context icon, the hover disclosure, the
		* expandable Markdown summary and the pinned-header layout. The Host
		* projection therefore carries the usage, a null-rendering decorator (the
		* composer dock entry, which is always mounted) matches each rendered marker
		* by the two counts it still prints, and the plugin stylesheet hides the
		* shipped text and shows the label from a custom property. The row itself
		* stays exactly the shipped one.
		*/
		/** Host projection key carrying one entry per landed compaction. */
		const COMPACTION_USAGE_PROJECTION = "statusbarCompactionUsage";
		/** Row marker set on a compaction button whose summary was replaced. */
		const COMPACTION_LABEL_ATTRIBUTE = "data-dsc-compaction-label";
		/** Custom property carrying the quoted replacement label on that button. */
		const COMPACTION_LABEL_PROPERTY = "--dsc-compaction-label";
		/** The shipped marker's context icon; only compaction rows carry it. */
		const MARKER_ICON = "[data-compaction-icon=\"context\"]";
		/**
		* Format one compaction's summarizer usage.
		* @param entry - projection entry for the compaction.
		* @returns `输入合计→输出 tokens`, e.g. `173.3K→2.4K tokens`.
		*/
		function compactionUsageLabel(entry) {
			return `${formatTokens(entry.inputTokens)}→${formatTokens(entry.outputTokens)} tokens`;
		}
		/**
		* Read the `items`/`tokens` pair out of the shipped summary text. Locale
		* independent: both dictionaries print exactly those two integers.
		* @param text - the rendered summary text.
		* @returns the pair, or undefined when the marker printed a fallback string.
		*/
		function shadowedCounts(text) {
			const numbers = text.match(/\d[\d,]*/g);
			if (numbers === null || numbers.length !== 2) return;
			const items = Number(numbers[0]?.replaceAll(",", ""));
			const tokens = Number(numbers[1]?.replaceAll(",", ""));
			if (!Number.isSafeInteger(items) || !Number.isSafeInteger(tokens)) return;
			return {
				items,
				tokens
			};
		}
		/** Stable lookup key for one marker's printed counts. */
		function countsKey(counts) {
			return `${counts.items}/${counts.tokens}`;
		}
		/** Index the projection entries by the counts each marker prints. */
		function entriesByCounts(entries) {
			const byCounts = /* @__PURE__ */ new Map();
			for (const entry of entries) byCounts.set(countsKey(entry), entry);
			return byCounts;
		}
		/**
		* Replace one marker's summary text when the projection covers its counts.
		* Idempotent: re-applying rewrites the same attribute and property.
		* @param button - the compaction marker's button.
		* @param byCounts - projection entries indexed by printed counts.
		* @returns whether the row was labelled.
		*/
		function labelMarkerButton(button, byCounts) {
			const summary = button.lastElementChild;
			if (summary === null) return false;
			const counts = shadowedCounts(summary.textContent ?? "");
			if (counts === void 0) return false;
			const entry = byCounts.get(countsKey(counts));
			if (entry === void 0) return false;
			button.setAttribute(COMPACTION_LABEL_ATTRIBUTE, "true");
			button.style.setProperty(COMPACTION_LABEL_PROPERTY, JSON.stringify(compactionUsageLabel(entry)));
			return true;
		}
		/**
		* Collect the marker buttons among nodes just inserted into the document.
		* @param nodes - one mutation record's added nodes.
		* @returns the affected compaction buttons; callers deduplicate.
		*/
		function markerButtonsIn(nodes) {
			const buttons = [];
			for (const node of nodes) {
				if (node.nodeType !== 1) continue;
				const element = node;
				if (element.matches(MARKER_ICON)) {
					const button = element.closest("button");
					if (button !== null) buttons.push(button);
					continue;
				}
				if (element.querySelector(MARKER_ICON) === null) continue;
				for (const icon of element.querySelectorAll(MARKER_ICON)) {
					const button = icon.closest("button");
					if (button !== null) buttons.push(button);
				}
			}
			return buttons;
		}
		/**
		* Replace the summary text of every compaction marker the projection covers.
		* @param root - document or subtree containing the markers.
		* @param entries - projection entries for this Session.
		*/
		function applyCompactionLabels(root, entries) {
			if (entries.length === 0) return;
			const byCounts = entriesByCounts(entries);
			for (const icon of root.querySelectorAll(MARKER_ICON)) {
				const button = icon.closest("button");
				if (button !== null) labelMarkerButton(button, byCounts);
			}
		}
		/**
		* Keep every rendered compaction marker labelled with its summarizer usage.
		* Mounted from the always-rendered composer dock entry, so it shares the
		* Session projection seat instead of owning a row of its own. One layout pass
		* covers the rows already painted; a MutationObserver covers the ones the
		* transcript mounts later.
		* @param useProjection - Session standard-props projection reader.
		*/
		function useCompactionLabelPatch(useProjection) {
			const entries = useProjection(COMPACTION_USAGE_PROJECTION);
			const latest = (0, react.useRef)(entries);
			latest.current = entries;
			(0, react.useLayoutEffect)(() => {
				if (typeof document === "undefined" || entries === void 0) return;
				applyCompactionLabels(document, entries);
			}, [entries]);
			(0, react.useEffect)(() => {
				if (typeof document === "undefined" || typeof MutationObserver === "undefined") return;
				const queue = /* @__PURE__ */ new Set();
				let frame;
				const flush = () => {
					frame = void 0;
					const pending = [...queue];
					queue.clear();
					const current = latest.current;
					if (current === void 0 || current.length === 0) return;
					const byCounts = entriesByCounts(current);
					for (const button of pending) labelMarkerButton(button, byCounts);
				};
				const schedule = (buttons) => {
					if (buttons.length === 0) return;
					for (const button of buttons) queue.add(button);
					if (frame !== void 0) return;
					frame = typeof requestAnimationFrame === "undefined" ? void 0 : requestAnimationFrame(flush);
					if (frame === void 0) flush();
				};
				const observer = new MutationObserver((records) => {
					const touched = [];
					for (const record of records) {
						touched.push(...markerButtonsIn(record.addedNodes));
						const target = record.target;
						const element = target.nodeType === 1 ? target : target.parentElement;
						if (element === null) continue;
						const owner = element.closest("button");
						if (owner !== null && owner.querySelector(MARKER_ICON) !== null) touched.push(owner);
					}
					schedule(touched);
				});
				observer.observe(document.body, {
					childList: true,
					subtree: true,
					characterData: true
				});
				return () => {
					observer.disconnect();
					if (frame !== void 0) cancelAnimationFrame(frame);
				};
			}, []);
		}
		//#endregion
		//#region src/client/turn-usage.ts
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
		const NO_USAGE = Object.freeze([]);
		/**
		* Stable fallback source. Assemblies without the per-Turn reader, and Sessions
		* whose Turn carries no accounting, behave exactly like the shipped UI.
		*/
		const NO_USAGE_SOURCE = Object.freeze({
			getSnapshot: () => NO_USAGE,
			subscribe: () => () => {}
		});
		/**
		* Read the Turn number out of the Turn-tail owner currency.
		* @param owner - the Turn location DSH passes, or a bare number.
		* @returns the owning Turn number.
		*/
		function turnNumberOf(owner) {
			return typeof owner === "number" ? owner : owner.turn;
		}
		/**
		* Resolve one Turn's observable Turn-tail data.
		* @param snapshot - Chat snapshot, absent outside an active Chat target.
		* @param turn - owning Turn number.
		* @returns the Turn's per-kind data source, or the shared empty source.
		*/
		function readTurnUsageSource(snapshot, turn) {
			return snapshot?.nodes?.turnDataSource?.(turn, "turn-tail") ?? NO_USAGE_SOURCE;
		}
		/**
		* Format one Turn's usage as the composer footer's compact counters.
		* @param usage - the Turn's provider-reported accounting.
		* @returns `cache-read/uncached-input/output`, or null when cache reads were
		* never reported, so the shipped total stays visible instead of a fabricated 0.
		*/
		function formatTurnUsageLabel(usage) {
			if (usage === void 0 || usage.cacheReadTokens === void 0) return null;
			return [
				formatTokens(usage.cacheReadTokens),
				formatTokens(usage.uncachedInputTokens),
				formatTokens(usage.outputTokens)
			].join("/");
		}
		/**
		* Pick the label out of one Turn's Turn-tail entries; the latest entry wins.
		* @param data - entries in anchor order.
		* @returns the label, or null when no entry carries cache reads.
		*/
		function turnUsageLabel(data) {
			for (let index = data.length - 1; index >= 0; index -= 1) {
				const label = formatTurnUsageLabel(data[index]?.tokenUsage);
				if (label !== null) return label;
			}
			return null;
		}
		//#endregion
		//#region src/client/fork-row-usage.ts
		/**
		* Compaction-row usage: `@local/dsh-fork-after-compaction` renders the shipped
		* completed-Turn IconActions chrome (copy, branch, usage, clock) under each
		* landed context compaction. DSH ships no standalone usage component or Slot,
		* so that row publishes its summarizer buckets on itself and this plugin owns
		* the display format here too — the row's fallback text is replaced with the
		* same cache-read/uncached-input/output label the shipped Turn pill gets.
		*
		* The row dispatches a bubbling `dsh-fork-row-usage` event when it mounts; this
		* patch also scans the document once for rows that mounted before the plugin.
		* Nothing is polled, and the usage pill, its database glyph and the
		* narrow-viewport icon-only collapse stay exactly the row's own.
		*/
		/** Row marker published by the fork plugin: the compaction's summary event seq. */
		const FORK_ROW_USAGE_ATTRIBUTE = "data-dfac-usage";
		/** Decoration attribute set on a usage pill whose text was replaced. */
		const FORK_ROW_USAGE_MARK = "data-dsc-fork-row-usage";
		/** Custom property carrying the quoted label text on that pill. */
		const FORK_ROW_USAGE_PROPERTY = "--dsc-fork-row-usage-label";
		/** Bubbling event the fork plugin dispatches when a row mounts. */
		const FORK_ROW_USAGE_EVENT = "dsh-fork-row-usage";
		const COUNT = /^(0|[1-9]\d*)$/;
		/** Read one published non-negative integer attribute. */
		function countAttribute(element, name) {
			const raw = element.getAttribute(name);
			if (raw === null || !COUNT.test(raw)) return void 0;
			const value = Number(raw);
			return Number.isSafeInteger(value) ? value : void 0;
		}
		/**
		* Read one published row's summarizer buckets.
		* @param element - the row's usage pill.
		* @returns the buckets, or undefined when the row published no complete usage.
		*/
		function readForkRowUsage(element) {
			const cacheReadTokens = countAttribute(element, "data-dfac-cache-read");
			const uncachedInputTokens = countAttribute(element, "data-dfac-uncached-input");
			const outputTokens = countAttribute(element, "data-dfac-output");
			if (cacheReadTokens === void 0 || uncachedInputTokens === void 0 || outputTokens === void 0) return;
			return {
				cacheReadTokens,
				uncachedInputTokens,
				outputTokens
			};
		}
		/**
		* Replace one compaction row's fallback usage text.
		* @param element - the row's usage pill.
		*/
		function applyForkRowUsage(element) {
			const usage = readForkRowUsage(element);
			if (usage === void 0) return;
			const label = formatTurnUsageLabel(usage);
			if (label === null) return;
			element.setAttribute(FORK_ROW_USAGE_MARK, "true");
			element.style.setProperty(FORK_ROW_USAGE_PROPERTY, JSON.stringify(label));
		}
		/**
		* Replace every published row's usage text under a root.
		* @param root - document or subtree containing the rows.
		*/
		function applyForkRowUsageLabels(root) {
			for (const element of root.querySelectorAll(`[${FORK_ROW_USAGE_ATTRIBUTE}]`)) applyForkRowUsage(element);
		}
		/**
		* Keep every rendered compaction row labelled with this plugin's format.
		* Mounted from the always-rendered composer dock entry, like the marker patch.
		*/
		function useForkRowUsagePatch() {
			(0, react.useLayoutEffect)(() => {
				if (typeof document === "undefined") return;
				applyForkRowUsageLabels(document);
				const onRow = (event) => {
					const target = event.target;
					if (target instanceof Element && target.hasAttribute("data-dfac-usage")) applyForkRowUsage(target);
				};
				document.addEventListener(FORK_ROW_USAGE_EVENT, onRow);
				const timer = setTimeout(() => {
					applyForkRowUsageLabels(document);
				}, 300);
				return () => {
					document.removeEventListener(FORK_ROW_USAGE_EVENT, onRow);
					clearTimeout(timer);
				};
			}, []);
		}
		//#endregion
		//#region src/client/StatsLine.tsx
		/** Replace only the native session `usage` entry. */
		function ConfigurableStatsLine({ settings, t, useChat, useProjection }) {
			const snapshot = (0, react.useSyncExternalStore)((listener) => settings.subscribe(listener), () => settings.getSnapshot(), () => settings.getSnapshot());
			useCompactionLabelPatch(useProjection);
			useForkRowUsagePatch();
			const settledNodes = useChat((s) => s.legacy.nodes);
			const usage = useProjection("tokenUsage");
			const windowUsage = useProjection("statusbarWindowUsage");
			const pressure = useProjection("contextPressure");
			const projectedStats = useProjection("sessionStats");
			const stats = (0, react.useMemo)(() => projectedStats ?? deriveStats(settledNodes ?? []), [projectedStats, settledNodes]);
			const value = snapshot.value ?? DEFAULT_SETTINGS;
			const hasUsage = usage !== void 0 && (billedInputTokens(usage) > 0 || usage.outputTokens > 0);
			const hit = usage === void 0 ? null : cacheHitPercent(usage);
			const template = resolveUsageTemplate(value.template.trim()).trim();
			const line = !value.enabled || !hasUsage || usage === void 0 ? "" : template !== "" ? renderTemplate(selectFooterTemplate(template, windowUsage), stats, usage, windowUsage).trim() : [formatTokens(billedInputTokens(usage) + usage.outputTokens) + " tok", hit === null ? null : t("stats.cacheHit", { percent: hit })].filter((part) => part !== null).join(" · ");
			const contextLabel = contextMeterReading(pressure);
			const rootRef = (0, react.useRef)(null);
			const labelRef = (0, react.useRef)(null);
			const [truncated, setTruncated] = (0, react.useState)(false);
			const [open, setOpen] = (0, react.useState)(false);
			(0, react.useLayoutEffect)(() => {
				if (line === "" || contextLabel === null) return;
				const dock = rootRef.current?.closest("[data-composer-dock]");
				if (!dock) return;
				const label = JSON.stringify(contextLabel);
				dock.setAttribute("data-dsc-context-meter", "true");
				dock.style.setProperty("--dsc-context-meter-label", label);
				return () => {
					if (dock.style.getPropertyValue("--dsc-context-meter-label") === label) {
						dock.style.removeProperty("--dsc-context-meter-label");
						dock.removeAttribute("data-dsc-context-meter");
					}
				};
			}, [line, contextLabel]);
			(0, react.useLayoutEffect)(() => {
				const element = labelRef.current;
				if (!element) return;
				const measure = () => setTruncated(element.scrollWidth > element.clientWidth);
				measure();
				if (typeof ResizeObserver === "undefined") return;
				const observer = new ResizeObserver(measure);
				observer.observe(element);
				return () => observer.disconnect();
			}, [line]);
			(0, react.useEffect)(() => {
				if (!open) return;
				const outside = (event) => {
					if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
				};
				const escape = (event) => {
					if (event.key === "Escape") setOpen(false);
				};
				document.addEventListener("pointerdown", outside);
				document.addEventListener("keydown", escape);
				return () => {
					document.removeEventListener("pointerdown", outside);
					document.removeEventListener("keydown", escape);
				};
			}, [open]);
			if (line === "" || usage === void 0) return null;
			const exact = (n) => n.toLocaleString();
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				ref: rootRef,
				className: "dsc-stats",
				"data-composer-stat": "usage",
				"data-dsh-statusbar-config": "true",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "dsc-stats-trigger",
					title: truncated ? line : void 0,
					"aria-label": line,
					"aria-haspopup": "dialog",
					"aria-expanded": open,
					onClick: () => setOpen((current) => !current),
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
						className: "dsc-stats-icon",
						width: "14",
						height: "14",
						viewBox: "0 0 24 24",
						fill: "none",
						stroke: "currentColor",
						strokeWidth: "1.8",
						"aria-hidden": "true",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("ellipse", {
							cx: "12",
							cy: "5",
							rx: "9",
							ry: "3"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M3 5v7c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12v7c0 1.7 4 3 9 3s9-1.3 9-3v-7" })]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						ref: labelRef,
						className: "dsc-stats-label",
						children: line
					})]
				}), open && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dsc-usage-panel",
					role: "dialog",
					"aria-label": t("stats.usageTitle"),
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsc-usage-heading",
							children: [
								t("stats.usageTitle"),
								" · ",
								exact(billedInputTokens(usage) + usage.outputTokens),
								" tok"
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dl", {
							className: "dsc-usage-details",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("stats.usageCacheRead") }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: exact(usage.cacheReadTokens) }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("stats.usageUncached") }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: exact(usage.uncachedInputTokens) }),
								usage.cacheWriteTokens !== 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("stats.usageCacheWrite") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: exact(usage.cacheWriteTokens) })] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("stats.usageOutput") }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: exact(usage.outputTokens) }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("stats.usageCacheHit") }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: hit === null ? "—" : hit + "%" })
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsc-usage-heading dsc-usage-window-title",
							children: [
								t("stats.windowTitle"),
								" · ",
								windowUsage === void 0 ? "—" : exact(billedInputTokens(windowUsage) + windowUsage.outputTokens) + " tok"
							]
						}),
						windowUsage !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dl", {
							className: "dsc-usage-details",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("stats.usageCacheRead") }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: exact(windowUsage.cacheReadTokens) }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("stats.usageUncached") }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: exact(windowUsage.uncachedInputTokens) }),
								windowUsage.cacheWriteTokens !== 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("stats.usageCacheWrite") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: exact(windowUsage.cacheWriteTokens) })] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("stats.usageOutput") }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: exact(windowUsage.outputTokens) })
							]
						})
					]
				})]
			});
		}
		//#endregion
		//#region src/client/styles.ts
		const STYLE_ID = "dsh-statusbar-config/styles";
		const styles = `
.dsc-stats{box-sizing:border-box;display:block;width:100%;max-width:var(--dsh-chat-content-width);margin:0 auto;padding:4px calc(var(--dsh-composer-side-clearance) + 16px) 0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:20px;text-align:center;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}
.dsc-stats-separator{color:var(--dsw-alias-separator-primary);margin:0 10px}
.dsc-card{box-sizing:border-box;width:100%;list-style:none;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);transition:border-color .16s,background .16s}
.dsc-card:hover{border-color:var(--dsw-alias-label-dimmed)}
.dsc-card[data-open=true]{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}
.dsc-card-header{appearance:none;box-sizing:border-box;width:100%;border:0;border-radius:12px;background:transparent;color:inherit;display:flex;align-items:center;gap:12px;padding:14px 16px;text-align:left;font:inherit;cursor:pointer}
.dsc-card-header:focus-visible,.dsc-toggle input:focus-visible+.dsc-switch,.dsc-button:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.dsc-card-heading{display:flex;min-width:0;flex:1;flex-direction:column;gap:4px}
.dsc-card-title{font-size:15px;line-height:1.4;font-weight:600}
.dsc-card-description{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}
.dsc-card-chevron{width:16px;height:16px;color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .16s}
.dsc-card[data-open=true] .dsc-card-chevron{transform:rotate(180deg)}
.dsc-card-body{border-top:1px solid var(--dsw-alias-border-l2);margin:0 16px;padding:4px 0 8px}
.dsc-row{display:flex;align-items:center;gap:14px;padding:12px 0}
.dsc-row+.dsc-row{border-top:1px solid var(--dsw-alias-border-l2)}
.dsc-row[data-disabled=true]{opacity:.5}
.dsc-copy{display:flex;min-width:0;flex:1;flex-direction:column;gap:2px}
.dsc-label{font-size:13px;line-height:1.5;font-weight:500}
.dsc-hint,.dsc-status{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:1.5}
.dsc-status[data-kind=error]{color:var(--dsw-alias-label-error)}
.dsc-status[data-kind=success]{color:var(--dsw-alias-state-success-primary)}
.dsc-toggle{position:relative;display:inline-flex;flex:none;cursor:pointer}
.dsc-toggle input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
.dsc-switch{box-sizing:border-box;width:34px;height:20px;border-radius:999px;background:var(--dsw-alias-border-l1);padding:2px;transition:background .16s}
.dsc-switch::after{content:'';display:block;width:16px;height:16px;border-radius:50%;background:var(--dsw-alias-bg-layer-1);box-shadow:var(--dsw-shadow-lv1);transition:transform .16s}
.dsc-toggle input:checked+.dsc-switch{background:var(--dsw-alias-brand-primary)}
.dsc-toggle input:checked+.dsc-switch::after{transform:translateX(14px)}
.dsc-toggle input:disabled+.dsc-switch{cursor:default}
.dsc-footer{border-top:1px solid var(--dsw-alias-border-l2);display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:12px 0 4px}
.dsc-footer-copy{display:flex;min-width:0;flex:1;flex-direction:column;gap:2px}
.dsc-button{appearance:none;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;line-height:1.5;padding:5px 14px;cursor:pointer}
.dsc-button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.dsc-button:disabled{opacity:.4;cursor:default}
.dsc-template-row{display:block}
.dsc-template-row .dsc-copy{width:100%}
.dsc-input{box-sizing:border-box;width:100%;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:1.6;padding:7px 10px;margin-top:6px}
.dsc-input:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px;border-color:transparent}
.dsc-input:disabled{opacity:.5}
.dsc-input::placeholder{color:var(--dsw-alias-label-dimmed)}
.dsc-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.dsc-chip{position:relative;appearance:none;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;line-height:1;padding:5px 10px;cursor:pointer;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.dsc-chip:hover:not(:disabled){border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary)}
.dsc-chip:disabled{opacity:.4;cursor:default}
.dsc-chip::after{content:attr(data-tip);position:absolute;top:calc(100% + 6px);left:var(--tip-left,0px);transform:none;width:max-content;max-width:min(320px,80vw);box-sizing:border-box;background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:6px 10px;font-size:12px;line-height:1.5;white-space:normal;text-align:left;box-shadow:var(--dsw-shadow-lv1);opacity:0;pointer-events:none;transition:opacity .12s;z-index:5}
.dsc-chip:hover::after,.dsc-chip:focus-visible::after{opacity:1}

/* Session token usage pill in DSH's official 'usage' dock entry. */
.dsc-stats{position:relative;box-sizing:border-box;display:inline-flex;flex:none;width:auto;max-width:min(65vw,800px);min-width:0;margin:0;padding:0;overflow:visible;text-align:left;font-size:calc(var(--dsh-content-font-size-secondary, 13px) - 1px);line-height:calc(20px + var(--dsh-content-font-delta-secondary, 0px))}
.dsc-stats-trigger{display:inline-flex;align-items:center;gap:6px;box-sizing:border-box;max-width:100%;min-width:0;padding:1px 8px;border:0;border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;line-height:inherit;white-space:nowrap;cursor:pointer}
.dsc-stats-trigger:hover,.dsc-stats-trigger[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}
.dsc-stats-trigger:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.dsc-stats-icon{flex:none}
.dsc-stats-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-variant-numeric:tabular-nums}
.dsc-usage-panel{position:absolute;bottom:calc(100% + 8px);right:0;z-index:1100;box-sizing:border-box;width:min(270px,calc(100vw - 24px));padding:12px;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-lg);background:var(--dsw-specific-menu);color:var(--dsw-alias-label-secondary);box-shadow:var(--dsw-elevation-prominent);font-size:12px;line-height:20px;white-space:normal;text-align:left}
.dsc-usage-heading{margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--dsw-alias-border-l2);font-weight:600;color:var(--dsw-alias-label-primary)}
.dsc-usage-window-title{margin-top:12px}
.dsc-usage-details{display:grid;grid-template-columns:minmax(0,1fr) max-content;gap:4px 10px;margin:0;font-variant-numeric:tabular-nums}
.dsc-usage-details dt,.dsc-usage-details dd{margin:0}
.dsc-usage-details dd{color:var(--dsw-alias-label-primary);text-align:right}
/* ContextMeter is hardcoded after the Slot: preserve its button, ring and dialog. */
[data-composer-dock][data-dsc-context-meter=true] > span:last-child button[aria-haspopup=dialog] > span{display:none}
[data-composer-dock][data-dsc-context-meter=true] > span:last-child button[aria-haspopup=dialog]::after{content:var(--dsc-context-meter-label);font-variant-numeric:tabular-nums;white-space:nowrap}
@media(max-width:700px){.dsc-stats{max-width:42vw}.dsc-stats-trigger{padding-inline:3px}[data-composer-dock][data-dsc-context-meter=true] > span:last-child button[aria-haspopup=dialog]{padding-inline:3px}}

/* Completed-Turn usage pill: the TurnUsageLabel entry puts the R/I/O counters on
   the Turn-tail root, and this replaces the shipped "usage <total> tok" text.
   DSH has no per-Turn usage Slot; the pill's icon, hover, click dialog and its
   narrow-viewport icon-only collapse remain the shipped ones. */
[data-turn-tail][data-dsc-turn-usage=true] button[aria-haspopup=dialog] > span:last-child{display:none}
[data-turn-tail][data-dsc-turn-usage=true] button[aria-haspopup=dialog]::after{content:var(--dsc-turn-usage-label);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-variant-numeric:tabular-nums}
@media(max-width:480px){[data-turn-tail][data-dsc-turn-usage=true] button[aria-haspopup=dialog]::after{display:none}}

/* Compaction marker: the shipped row keeps its icon, hover disclosure,
   expandable summary and pinned header; only the summary text changes, from the
   estimated replaced-history size to the summarization call's 输入合计→输出.
   The decorator publishes the label on the row's button, the last span is the
   shipped summary, and the pseudo-element inherits the button's color. */
[data-dsc-compaction-label=true] > span:last-child{display:none}
[data-dsc-compaction-label=true]::after{content:var(--dsc-compaction-label);flex:1 1 auto;min-width:0;overflow:hidden;color:inherit;font-size:var(--dsh-content-font-size-secondary,13px);line-height:calc(24px + var(--dsh-content-font-delta,0px));white-space:nowrap;text-overflow:ellipsis;font-variant-numeric:tabular-nums}

/* Compaction Fork row (dsh-fork-after-compaction): the row publishes its
   summarizer buckets on a data-dfac-usage pill, and this replaces the row's
   fallback R/I/O text with the same label the Turn pill gets. The pill's
   database glyph and narrow-viewport icon-only collapse stay the row's. */
[data-dfac-usage][data-dsc-fork-row-usage=true] [data-dfac-usage-label]{display:none}
[data-dfac-usage][data-dsc-fork-row-usage=true]::after{content:var(--dsc-fork-row-usage-label);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-variant-numeric:tabular-nums}
@media(max-width:480px){[data-dfac-usage][data-dsc-fork-row-usage=true]::after{display:none}}

`;
		//#endregion
		//#region src/client/TurnUsageLabel.tsx
		/**
		* Invisible per-Turn decorator. DSH builds the completed-Turn usage pill inside
		* `TurnTailNodeView` and offers no Slot for it, so this entry publishes the
		* Turn's cache-read / uncached-input / output label on the Turn-tail root and
		* the plugin's scoped CSS swaps the shipped text. It renders nothing, so the
		* tail's flex layout and the native dialog, hover, icon and narrow-viewport
		* collapse all stay exactly as shipped.
		*/
		/** Turn-tail root marker; the scoped CSS only rewrites a marked tail. */
		const TURN_USAGE_ATTRIBUTE = "data-dsc-turn-usage";
		/** Turn-tail root custom property carrying the quoted label text. */
		const TURN_USAGE_LABEL_PROPERTY = "--dsc-turn-usage-label";
		/**
		* Publish one Turn's usage label on its Turn-tail root.
		* @param props - owning Turn and the Chat snapshot selector seat.
		* @returns null; this entry owns no visible row of its own.
		*/
		function TurnUsageLabel({ turn, useChat }) {
			const turnNumber = turnNumberOf(turn);
			const source = useChat((snapshot) => readTurnUsageSource(snapshot, turnNumber));
			const label = turnUsageLabel((0, react.useSyncExternalStore)(source.subscribe, source.getSnapshot, source.getSnapshot));
			(0, react.useLayoutEffect)(() => {
				const root = document.querySelector(`[data-turn-tail="${turnNumber}"]`);
				if (root === null || label === null) return;
				const value = JSON.stringify(label);
				root.setAttribute(TURN_USAGE_ATTRIBUTE, "true");
				root.style.setProperty(TURN_USAGE_LABEL_PROPERTY, value);
				return () => {
					if (root.style.getPropertyValue("--dsc-turn-usage-label") === value) root.style.removeProperty(TURN_USAGE_LABEL_PROPERTY);
					root.removeAttribute(TURN_USAGE_ATTRIBUTE);
				};
			}, [turnNumber, label]);
			return null;
		}
		//#endregion
		//#region src/client/index.tsx
		const PLUGIN_ID = "dsh-statusbar-config";
		const inject = [
			"slots",
			"configForms",
			"locale"
		];
		function installStyles() {
			document.querySelector(`style[data-plugin-css="${STYLE_ID}"]`)?.remove();
			const tag = document.createElement("style");
			tag.dataset.plugin = PLUGIN_ID;
			tag.dataset.pluginCss = STYLE_ID;
			tag.textContent = styles;
			document.head.append(tag);
			return () => tag.remove();
		}
		function BundleConfigCard(props) {
			return props.view === "summary" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(StatusbarSettingsCard, { ...props });
		}
		function apply(ctx) {
			ctx.effect(installStyles, "dsh-statusbar-config: styles");
			ctx.effect(() => ctx.locale.register(LOCALE_NAMESPACE, {
				zh,
				en
			}), "dsh-statusbar-config: locale");
			const settings = ctx.configForms.get(PLUGIN_ID);
			ctx.slots.inject("plugins.bundle.config", () => ctx.slots.register({
				name: "plugins.bundle.config",
				key: PLUGIN_ID,
				locale: LOCALE_NAMESPACE,
				inject: () => ({ settings })
			}, BundleConfigCard));
			ctx.slots.inject("conversation.composer.dock", () => ctx.slots.register({
				name: "conversation.composer.dock",
				id: "usage",
				order: 1,
				priority: -1,
				locale: LOCALE_NAMESPACE,
				inject: () => ({ settings })
			}, ConfigurableStatsLine));
			ctx.slots.inject("conversation.chat.turnTail", () => ctx.slots.register({
				name: "conversation.chat.turnTail",
				id: "turn-usage-label",
				order: 0
			}, TurnUsageLabel));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map