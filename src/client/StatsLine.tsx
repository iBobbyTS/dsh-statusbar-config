import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { SettingsScopeLike } from './runtime.js'
import type { ContextPressureProjection, ConversationNode, SessionStatsProjection, SnapshotSelector, TokenUsageProjection, WindowUsageProjection } from './types.js'
import { DEFAULT_SETTINGS, resolveUsageTemplate, type StatusbarSettings } from '../settings.js'
import type { Translate } from './locales.js'
import { billedInputTokens, cacheHitPercent, contextMeterReading, deriveStats, formatTokens, renderTemplate } from './stats.js'

export interface DockProps {
  settings: SettingsScopeLike<StatusbarSettings>
  t: Translate
  useChat: SnapshotSelector<{ legacy: { nodes: readonly ConversationNode[] } }>
  useProjection: <T>(name: string) => T | undefined
}

/** Replace only the native session `usage` entry. */
export function ConfigurableStatsLine({ settings, t, useChat, useProjection }: DockProps) {
  const snapshot = useSyncExternalStore(
    listener => settings.subscribe(listener),
    () => settings.getSnapshot(),
    () => settings.getSnapshot(),
  )
  const settledNodes = useChat(s => s.legacy.nodes)
  const usage = useProjection<TokenUsageProjection>('tokenUsage')
  const windowUsage = useProjection<WindowUsageProjection>('statusbarWindowUsage')
  const pressure = useProjection<ContextPressureProjection>('contextPressure')
  const projectedStats = useProjection<SessionStatsProjection>('sessionStats')
  const stats = useMemo(() => projectedStats ?? deriveStats(settledNodes ?? []), [projectedStats, settledNodes])
  const value = snapshot.value ?? DEFAULT_SETTINGS
  const hasUsage = usage !== undefined && (billedInputTokens(usage) > 0 || usage.outputTokens > 0)
  const hit = usage === undefined ? null : cacheHitPercent(usage)
  const template = resolveUsageTemplate(value.template.trim()).trim()
  const line = !value.enabled || !hasUsage || usage === undefined ? ''
    : template !== '' ? renderTemplate(template, stats, usage, windowUsage).trim()
      : [formatTokens(billedInputTokens(usage) + usage.outputTokens) + ' tok',
        hit === null ? null : t('stats.cacheHit', { percent: hit })]
        .filter((part): part is string => part !== null).join(' · ')
  const contextLabel = contextMeterReading(pressure)
  const rootRef = useRef<HTMLSpanElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const [truncated, setTruncated] = useState(false)
  const [open, setOpen] = useState(false)

  // No ContextMeter Slot yet: override visible label only; keep ring and dialog.
  useLayoutEffect(() => {
    if (line === '' || contextLabel === null) return
    const dock = rootRef.current?.closest<HTMLElement>('[data-composer-dock]')
    if (!dock) return
    const label = JSON.stringify(contextLabel)
    dock.setAttribute('data-dsc-context-meter', 'true')
    dock.style.setProperty('--dsc-context-meter-label', label)
    return () => {
      if (dock.style.getPropertyValue('--dsc-context-meter-label') === label) {
        dock.style.removeProperty('--dsc-context-meter-label')
        dock.removeAttribute('data-dsc-context-meter')
      }
    }
  }, [line, contextLabel])

  useLayoutEffect(() => {
    const element = labelRef.current
    if (!element) return
    const measure = () => setTruncated(element.scrollWidth > element.clientWidth)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [line])

  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false)
    }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [open])

  if (line === '' || usage === undefined) return null
  const exact = (n: number) => n.toLocaleString()
  return <span ref={rootRef} className="dsc-stats" data-composer-stat="usage" data-dsh-statusbar-config="true">
    <button type="button" className="dsc-stats-trigger" title={truncated ? line : undefined}
      aria-label={line} aria-haspopup="dialog" aria-expanded={open}
      onClick={() => setOpen(current => !current)}>
      <svg className="dsc-stats-icon" width="14" height="14" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <ellipse cx="12" cy="5" rx="9" ry="3"/>
        <path d="M3 5v7c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12v7c0 1.7 4 3 9 3s9-1.3 9-3v-7"/>
      </svg>
      <span ref={labelRef} className="dsc-stats-label">{line}</span>
    </button>
    {open && <div className="dsc-usage-panel" role="dialog" aria-label={t('stats.usageTitle')}>
      <div className="dsc-usage-heading">
        {t('stats.usageTitle')} · {exact(billedInputTokens(usage) + usage.outputTokens)} tok
      </div>
      <dl className="dsc-usage-details">
        <dt>{t('stats.usageCacheRead')}</dt><dd>{exact(usage.cacheReadTokens)}</dd>
        <dt>{t('stats.usageUncached')}</dt><dd>{exact(usage.uncachedInputTokens)}</dd>
        {usage.cacheWriteTokens !== 0 && <>
          <dt>{t('stats.usageCacheWrite')}</dt><dd>{exact(usage.cacheWriteTokens)}</dd>
        </>}
        <dt>{t('stats.usageOutput')}</dt><dd>{exact(usage.outputTokens)}</dd>
        <dt>{t('stats.usageCacheHit')}</dt><dd>{hit === null ? '—' : hit + '%'}</dd>
      </dl>
      <div className="dsc-usage-heading dsc-usage-window-title">
        {t('stats.windowTitle')} · {windowUsage === undefined ? '—'
          : exact(billedInputTokens(windowUsage) + windowUsage.outputTokens) + ' tok'}
      </div>
      {windowUsage !== undefined && <dl className="dsc-usage-details">
        <dt>{t('stats.usageCacheRead')}</dt><dd>{exact(windowUsage.cacheReadTokens)}</dd>
        <dt>{t('stats.usageUncached')}</dt><dd>{exact(windowUsage.uncachedInputTokens)}</dd>
        {windowUsage.cacheWriteTokens !== 0 && <>
          <dt>{t('stats.usageCacheWrite')}</dt><dd>{exact(windowUsage.cacheWriteTokens)}</dd>
        </>}
        <dt>{t('stats.usageOutput')}</dt><dd>{exact(windowUsage.outputTokens)}</dd>
      </dl>
    </div>}
  </span>
}
