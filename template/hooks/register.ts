import type { EngineInterface, On } from 'claude-code'
import { atom, read, update } from 'claude-code'
import { greeting } from './logic.ts'

const NAME = 'binnacle-hello'
/** The binnacle plugin interface this plugin is written for. */
const API = 1
const presses = atom({ plugin: 'binnacle-hello', key: 'presses' } as const, 0)
/** A setting's value lives in module memory: atoms start over at /clear and /resume (binnacle docs/plugins.md §5). */
let loud = false

/** binnacle's notify event, written out (binnacle's types/index.d.ts BinnacleNotify). */
type Notify =
  | { plugin: string; kind: 'press'; id: string; row?: string }
  | { plugin: string; kind: 'setting'; id: string; value: boolean }
  | { plugin: string; kind: 'open'; id: string }

/** What the person did with this plugin's things, after binnacle's notify chain. */
async function handle($: EngineInterface, e: Notify): Promise<void> {
  if (e.kind === 'setting' && e.id === 'loud') loud = e.value
  if (e.kind === 'press' && e.id === 'hello') {
    const n = (await read($, presses)) + 1
    await update($, presses, () => n)
    $.ui.toast(greeting(n, loud))
  }
}

export function register(on: On) {
  on('session.start', async ($, e, next) => {
    const r = await next(e)
    // binnacle missing or older: $.binnacle throws (binnacle docs/plugins.md §6), so every call sits in a try.
    try {
      const v = await $.binnacle.version({})
      if (v.api !== API) {
        $.ui.log(`${NAME}: written for binnacle's plugin API ${API}, found ${v.api}; not registering.`)
        return r
      }
      await $.binnacle.button({ id: 'hello', label: '✋ hello' })
      loud = (await $.binnacle.setting({ id: 'loud', title: 'Shout the greeting', default: false })).value
    } catch (err) {
      $.ui.log(`${NAME}: binnacle is not available (${String(err)}).`)
    }
    return r
  })

  on('binnacle.notify', async ($, e, next) => {
    // Anyone can call $.binnacle.notify (binnacle docs/plugins.md §4): only binnacle's own calls, and only ours.
    if (next.origin.plugin !== 'binnacle' || e.plugin !== NAME) return next(e)
    // Inside this chain a call back into $.binnacle never reaches binnacle (binnacle docs/plugins.md §4): the work runs after it.
    $.clock.after(0, () => void handle($, e))
    return { value: { handled: true } }
  }).catch(($, e, next) => (next.called ? { value: { handled: true } } : next(e)))
}
