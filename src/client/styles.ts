export const STYLE_ID = 'dsh-statusbar-config/styles'

export const styles = `
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

`
