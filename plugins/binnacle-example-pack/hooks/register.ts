import type { Register } from 'claude-code'

const RULE = { id: 'example.curl-pipe-shell', pack: 'example', title: 'Download piped into a shell', action: 'deny' } as const
const SHELLS = ['sh', 'bash', 'zsh']
const FETCHERS = ['curl', 'wget']
const FAILED = 'binnacle-example-pack: the check failed, so the call was blocked.'
/** The pack's setting: say each refusal in a toast. Module memory, as atoms start over at /clear (binnacle docs/plugins.md §5). */
let verbose = true

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const r = await next(e)
    await $.binnacle.register(RULE).catch(() => undefined)
    const enabled = await $.binnacle.enabled({ id: RULE.id }).catch(() => true)
    // Set only here, at session start: turning the rule on or off mid-session, or a /clear, shows up at the next session.
    // Attention: one line under the status line while the rule is off; empty text clears it.
    await $.binnacle.attention({ id: 'rule-off', level: 'warn', text: enabled ? '' : 'example pack: the curl-pipe-shell rule is off' }).catch(() => undefined)
    // Tab: a two-level tree in /binnacle; binnacle draws it and handles expand, scroll and width.
    await $.binnacle.tab({
      id: 'rules',
      title: 'Example',
      rows: [{ text: 'example pack', bold: true, children: [{ text: `${RULE.id} · ${RULE.action} · ${enabled ? 'on' : 'off'}`, color: enabled ? 'green' : 'yellow' }] }],
    }).catch(() => undefined)
    // A footer button and a setting: binnacle tells this plugin when the person uses them (binnacle.notify below).
    await $.binnacle.button({ id: 'pack', label: '⚑ pack' }).catch(() => undefined)
    verbose = (await $.binnacle.setting({ id: 'verbose', title: 'Say when the rule refuses', default: true }).catch(() => ({ value: true }))).value
    return r
  })

  on('binnacle.notify', async ($, e, next) => {
    // Only binnacle's own calls, and only this plugin's things (anyone can call $.binnacle.notify).
    if (next.origin.plugin !== 'binnacle' || e.plugin !== 'binnacle-example-pack') return next(e)
    if (e.kind === 'setting' && e.id === 'verbose') verbose = e.value
    if (e.kind === 'press' && e.id === 'pack') $.ui.toast('binnacle-example-pack: curl-pipe-shell is guarding this session')
    return { value: { handled: true } }
  }).catch(($, e, next) => (next.called ? { value: { handled: true } } : next(e)))

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    if (!(await $.binnacle.enabled({ id: RULE.id }).catch(() => false))) return next(e)
    const { segments } = await $.binnacle.shell({ command: e.command })
    const piped = segments.some((s, i) => i > 0 && SHELLS.includes(s.words[0] ?? '') && FETCHERS.includes(segments[i - 1].words[0] ?? ''))
    if (!piped) return next(e)
    await $.binnacle.record({ ruleId: RULE.id, action: 'deny', summary: e.command.slice(0, 120) })
    if (verbose) $.ui.toast('binnacle-example-pack refused a download piped into a shell')
    return { deny: 'binnacle-example-pack: piping a download into a shell runs code nobody has read. Download it, read it, then run it. Do not work around this with a different command; ask the user.' }
  }).catch(($, e, next) => (next.called ? next(e) : { deny: FAILED }))
}
