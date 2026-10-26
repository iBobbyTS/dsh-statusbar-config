/**
 * Host half: declare the Config schema the Plugins page edits.
 *
 * The settings service projects an entry's Config into that entry's form and
 * serves only the fields marked `.volatile()` (dsh's fork of schemastery);
 * without the flag the entry is absent from `settings/describe`, and the
 * bundle's card reports its namespace as unavailable with every control
 * disabled. Values land in the profile patch, and the Loader re-applies this
 * plugin on each write, so there is nothing else to register here.
 */
import type { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import { DEFAULT_SETTINGS, type StatusbarSettings } from './settings.js'
import { windowUsageProjectionDefinition } from './window-usage.js'

export const name = 'dsh-statusbar-config'

export type Config = StatusbarSettings

// Left unannotated: `.volatile()` wraps each field's schema type, so an
// explicit `Schema<StatusbarSettings>` annotation no longer type-checks while
// the runtime value stays the plain shape above.
export const Config = Schema.object({
  enabled: Schema.boolean().default(DEFAULT_SETTINGS.enabled).description('Display the configurable statistics row below the composer.').volatile(),
  template: Schema.string().default(DEFAULT_SETTINGS.template).role('textarea').description('Display template with ${variable} placeholders; empty = default statistics row. Variables: ${turns} ${steps} ${llm} ${tool} ${ttft} ${tps} ${cache} ${input} ${output} ${cacheRead} ${uncachedInput} ${cacheWrite} ${total} ${windowCacheRead} ${windowUncachedInput} ${windowCacheWrite} ${windowOutput} ${windowTotal}.').volatile(),
})

export function apply(ctx: Context): void {
  // The Session Projection registry owns replay, checkpointing and lifecycle.
  ctx.inject(['sessionProjections'], async (scoped) => {
    await scoped.sessionProjections.register(windowUsageProjectionDefinition)
  })
}
