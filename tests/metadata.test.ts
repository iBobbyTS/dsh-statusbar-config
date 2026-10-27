import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { en, zh } from '../src/client/locales.js'

const path = (file: string) => new URL(`../${file}`, import.meta.url)
const read = (file: string) => readFileSync(path(file), 'utf8')
const json = (file: string) => JSON.parse(read(file)) as Record<string, unknown>

const pkg = json('package.json') as {
  icon?: string
  exports?: Record<string, string>
  files?: string[]
}

describe('plugin display metadata', () => {
  it('ships English and Simplified Chinese names and descriptions', () => {
    for (const locale of ['en', 'zh']) {
      const meta = json(`locale/${locale}.json`).meta as Record<string, string>
      expect(meta.title.trim(), locale).not.toBe('')
      expect(meta.description.trim(), locale).not.toBe('')
    }
    const zhMeta = json('locale/zh.json').meta as Record<string, string>
    expect(zhMeta.title).toMatch(/[\u4e00-\u9fff]/u)
    expect(zhMeta.title).not.toBe((json('locale/en.json').meta as Record<string, string>).title)
  })

  it('exports the locale dictionaries and ships the original icon', () => {
    expect(pkg.icon).toBe('./icon.svg')
    expect(pkg.exports?.['./locale/*.json']).toBe('./locale/*.json')
    expect(pkg.files).toContain('icon.svg')
    expect(pkg.files).toContain('locale/*.json')
    expect(read('icon.svg')).toMatch(/^<svg[ >]/u)
    expect(new TextEncoder().encode(read('icon.svg')).byteLength).toBeLessThanOrEqual(256 * 1024)
  })

  it('keeps both Client dictionaries key-aligned', () => {
    expect(Object.keys(zh).sort()).toEqual(Object.keys(en).sort())
  })

  it('ships the current Chinese dictionary in the built Client bundle', () => {
    const bundle = read('lib/client.js')
    for (const value of Object.values(zh)) expect(bundle).toContain(JSON.stringify(value))
  })
})
