import { describe, expect, it } from 'vitest'
import { Config } from '../src/index.js'
import { DEFAULT_SETTINGS } from '../src/settings.js'

/** The field nodes dsh's `volatileForm` walks: `Config.toJSON()` only emits refs. */
const fields = Config.dict ?? {}

describe('Config schema', () => {
  it('exposes exactly the fields the settings card edits', () => {
    expect(Object.keys(fields).sort()).toEqual(['enabled', 'template'])
  })

  // dsh projects an entry's Config into a settings namespace only when at least
  // one field is volatile (`volatileForm`); without the flag the namespace is
  // absent from `settings/describe` and the card stays locked as unavailable.
  it('marks every field volatile so the Plugins page serves the namespace', () => {
    for (const [name, node] of Object.entries(fields)) {
      expect(node.meta.volatile, name).toBe(true)
    }
  })

  it('keeps the shipped defaults and the template textarea role', () => {
    expect(fields.enabled?.meta.default).toBe(DEFAULT_SETTINGS.enabled)
    expect(fields.template?.meta.default).toBe(DEFAULT_SETTINGS.template)
    expect(fields.template?.meta.role).toBe('textarea')
  })
})
