import { afterEach, describe, expect, it, vi } from 'vitest'

const hooks = vi.hoisted(() => ({ anchor: null as unknown, effects: [] as Array<() => void | (() => void)> }))
vi.mock('react', async (original) => ({
  ...await original<typeof import('react')>(),
  useRef: () => ({ current: hooks.anchor }),
  useLayoutEffect: (effect: () => void | (() => void)) => { hooks.effects.push(effect) },
  useEffect: (effect: () => void | (() => void)) => { hooks.effects.push(effect) },
  useSyncExternalStore: (_subscribe: unknown, get: () => unknown) => get(),
}))

import { TurnUsageLabel, TURN_USAGE_LABEL_PROPERTY } from '../src/client/TurnUsageLabel.js'
import { COMPACTION_LABEL_PROPERTY, useCompactionLabelPatch } from '../src/client/compaction-label.js'
import { useForkRowUsagePatch } from '../src/client/fork-row-usage.js'

function element() {
  const values = new Map<string, string>()
  const attrs = new Map<string, string>()
  return {
    values, attrs,
    setAttribute: (key: string, value: string) => { attrs.set(key, value) },
    removeAttribute: (key: string) => { attrs.delete(key) },
    style: {
      setProperty: (key: string, value: string) => { values.set(key, value) },
      getPropertyValue: (key: string) => values.get(key) ?? '',
      removeProperty: (key: string) => { values.delete(key) },
    },
  }
}

const cleanups: Array<() => void> = []
function commit() {
  for (const effect of hooks.effects.splice(0)) {
    const cleanup = effect()
    if (cleanup) cleanups.push(cleanup)
  }
}
afterEach(() => {
  cleanups.splice(0).forEach(cleanup => cleanup())
  hooks.effects = []
  vi.unstubAllGlobals()
})

describe('per-conversation decorators', () => {
  it('labels both Turn 1 roots independently and cleans up only its own label', () => {
    vi.stubGlobal('document', { querySelector: () => { throw new Error('global lookup crosses sessions') } })
    const a = element(), b = element()
    for (const [root, sessionId, output] of [[a, 'source', 3], [b, 'fork', 6]] as const) {
      hooks.anchor = { closest: () => root }
      TurnUsageLabel({ sessionId, turn: { turn: 1 }, useChat: select => select({}),
        useProjection: (() => [{ turn: 1, cacheReadTokens: 1, uncachedInputTokens: 2, outputTokens: output }]) as never })
    }
    commit()
    expect(a.values.get(TURN_USAGE_LABEL_PROPERTY)).toBe('"1/2/3"')
    expect(b.values.get(TURN_USAGE_LABEL_PROPERTY)).toBe('"1/2/6"')
    cleanups.shift()!()
    expect(a.values.has(TURN_USAGE_LABEL_PROPERTY)).toBe(false)
    expect(b.values.get(TURN_USAGE_LABEL_PROPERTY)).toBe('"1/2/6"')
  })

  it('observes and decorates only its mounted conversation, including later rows', () => {
    const row = { ...element(), lastElementChild: { textContent: 'Compacted 10 items (~20 tokens)' },
      querySelector: () => ({}) }
    const icon = { closest: () => row }
    const scope = { querySelectorAll: () => [icon], contains: (node: unknown) => node === row }
    const anchor = { current: { closest: () => scope } } as never
    const observed = vi.fn()
    let callback: MutationCallback
    vi.stubGlobal('MutationObserver', class {
      constructor(cb: MutationCallback) { callback = cb }
      observe = observed
      disconnect() {}
    })
    vi.stubGlobal('document', { querySelectorAll: () => { throw new Error('whole-page scan') }, body: {} })
    useCompactionLabelPatch((() => [{ seq: 50, items: 10, tokens: 20, inputTokens: 30, outputTokens: 4 }]) as never, anchor, 'fork')
    commit()
    expect(observed).toHaveBeenCalledWith(scope, { childList: true, subtree: true, characterData: true })
    expect(row.values.get(COMPACTION_LABEL_PROPERTY)).toBe('"30→4 tokens"')
    row.values.clear()
    callback!([{ addedNodes: [], target: { nodeType: 1, closest: () => row } }] as unknown as MutationRecord[], {} as MutationObserver)
    expect(row.values.get(COMPACTION_LABEL_PROPERTY)).toBe('"30→4 tokens"')
    cleanups.shift()!()
    expect(row.values.has(COMPACTION_LABEL_PROPERTY)).toBe(false)
  })

  it('does not install document-level patches without a conversation container', () => {
    vi.stubGlobal('document', { querySelectorAll: () => { throw new Error('global scan') } })
    const anchor = { current: { closest: () => null } } as never
    useCompactionLabelPatch((() => []) as never, anchor, 'unknown')
    useForkRowUsagePatch(anchor, 'unknown')
    commit()
  })
})
