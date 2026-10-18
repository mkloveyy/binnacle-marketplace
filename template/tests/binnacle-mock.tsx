import type { Plugin } from 'claude-code/testing'

/**
 * A stand-in for binnacle in `claude plugin test`, which loads no dependency: load it beside your plugin with
 * `test(name, { plugins: [binnacleMock] }, body)`. Copy this file into your plugin's tests/ as it is (an inline plugin
 * may use nothing outside its own register function).
 *
 * - Every call your plugin makes shows as a toast `binnacle-mock: <method> <plugin> <args as JSON>`: record toasts
 *   with `on('ui.toast', …)` and assert on them. `version` answers `{ api: 1, binnacle: 'mock' }`; `setting` answers
 *   its `default`; `shell` splits a command roughly on `|`, `;`, `&&`, `||`.
 * - Use what your plugin registered as the person would, from the mock's pane (`MOCK_PANE` below):
 *   `press-<plugin>-<id>` presses a button, segment or line; `setting-<plugin>-<id>` toggles a setting;
 *   `open-<plugin>-<tab>` opens a tab; `row-<plugin>-<tab>-<row id>` presses a row; `rowbutton-<plugin>-<tab>-<row id>-<button id>`
 *   presses a row's button. Each raises binnacle.notify from binnacle (so your origin check passes) and the press
 *   resolves once your handler has.
 */
export const binnacleMock: Plugin = {
  name: 'binnacle',
  register(on) {
    const ok = async () => ({ ok: true as const })
    const presses: { plugin: string; id: string }[] = []
    const settings: { plugin: string; id: string; value: boolean }[] = []
    const tabs: { plugin: string; id: string; rows: { id?: string; press?: boolean; buttons?: { id: string }[]; children?: unknown[] }[] }[] = []
    on('engine.create', async ($, e, next) => {
      const built = await next(e)
      return {
        ...built,
        binnacle: {
          version: async () => ({ api: 1, binnacle: 'mock' }), register: ok, enabled: async () => true, ask: async () => 'allow' as const,
          record: ok, shell: async () => ({ segments: [] }), attention: ok, tab: ok, button: ok, segment: ok, line: ok,
          setting: async () => ({ ok: true as const, value: false }), guardSource: ok, notify: async () => ({ handled: false }),
        },
      } as never
    })
    on('binnacle.register', async ($, e, next) => {
      $.ui.toast(`binnacle-mock: register ${next.origin.plugin} ${JSON.stringify(e)}`)
      return { value: { ok: true as const } }
    })
    on('binnacle.record', async ($, e, next) => {
      $.ui.toast(`binnacle-mock: record ${next.origin.plugin} ${JSON.stringify(e)}`)
      return { value: { ok: true as const } }
    })
    on('binnacle.attention', async ($, e, next) => {
      $.ui.toast(`binnacle-mock: attention ${next.origin.plugin} ${JSON.stringify(e)}`)
      return { value: { ok: true as const } }
    })
    on('binnacle.tab', async ($, e, next) => {
      $.ui.toast(`binnacle-mock: tab ${next.origin.plugin} ${JSON.stringify(e)}`)
      const at = tabs.findIndex(t => t.plugin === next.origin.plugin && t.id === e.id)
      if (at >= 0) tabs.splice(at, 1)
      if (e.rows.length) tabs.push({ plugin: next.origin.plugin, id: e.id, rows: e.rows as never })
      return { value: { ok: true as const } }
    })
    on('binnacle.button', async ($, e, next) => {
      $.ui.toast(`binnacle-mock: button ${next.origin.plugin} ${JSON.stringify(e)}`)
      presses.push({ plugin: next.origin.plugin, id: e.id })
      return { value: { ok: true as const } }
    })
    on('binnacle.segment', async ($, e, next) => {
      $.ui.toast(`binnacle-mock: segment ${next.origin.plugin} ${JSON.stringify(e)}`)
      presses.push({ plugin: next.origin.plugin, id: e.id })
      return { value: { ok: true as const } }
    })
    on('binnacle.line', async ($, e, next) => {
      $.ui.toast(`binnacle-mock: line ${next.origin.plugin} ${JSON.stringify(e)}`)
      presses.push({ plugin: next.origin.plugin, id: e.id })
      return { value: { ok: true as const } }
    })
    on('binnacle.guardSource', async ($, e, next) => {
      $.ui.toast(`binnacle-mock: guardSource ${next.origin.plugin} ${JSON.stringify(e)}`)
      return { value: { ok: true as const } }
    })
    on('binnacle.setting', async ($, e, next) => {
      $.ui.toast(`binnacle-mock: setting ${next.origin.plugin} ${JSON.stringify(e)}`)
      const value = e.default === true
      if (!settings.some(s => s.plugin === next.origin.plugin && s.id === e.id)) settings.push({ plugin: next.origin.plugin, id: e.id, value })
      return { value: { ok: true as const, value } }
    })
    // A rough split on |, ;, && and ||, words on spaces: enough for a rule pack's tests (binnacle's own parser is fuller).
    on('binnacle.shell', async (_$, e) => ({
      value: { segments: e.command.split(/\|\||&&|[|;]/).map(t => t.trim()).filter(Boolean).map(text => ({ text, words: text.split(/\s+/) })) },
    }))
    on('binnacle.version', async () => ({ value: { api: 1, binnacle: 'mock' } }))
    on('binnacle.enabled', async () => ({ value: true }))
    on('binnacle.notify', async () => ({ value: { handled: false } }))
    on('ui.render', { component: 'Pane' }, async ($, e, next) => {
      if (e.requestId !== 'binnacle-mock') return next(e)
      const { Box, Button } = $.ui.resolve(e)
      const rowButtons = tabs.flatMap(t => t.rows.flatMap(r => [
        ...(r.press && r.id !== undefined ? [{ key: `row-${t.plugin}-${t.id}-${r.id}`, plugin: t.plugin, id: r.id }] : []),
        ...(r.buttons ?? []).map(b => ({ key: `rowbutton-${t.plugin}-${t.id}-${r.id ?? ''}-${b.id}`, plugin: t.plugin, id: b.id, row: r.id })),
      ]))
      return (
        <Box flexDirection="column">
          {presses.map(p => <Button key={`press-${p.plugin}-${p.id}`} label={p.id} onPress={async () => { await $.binnacle.notify({ plugin: p.plugin, kind: 'press', id: p.id }) }} />)}
          {settings.map(s => (
            <Button key={`setting-${s.plugin}-${s.id}`} label={s.id} onPress={async () => {
              s.value = !s.value
              await $.binnacle.notify({ plugin: s.plugin, kind: 'setting', id: s.id, value: s.value })
            }} />
          ))}
          {tabs.map(t => <Button key={`open-${t.plugin}-${t.id}`} label={t.id} onPress={async () => { await $.binnacle.notify({ plugin: t.plugin, kind: 'open', id: t.id }) }} />)}
          {rowButtons.map(b => <Button key={b.key} label={b.id} onPress={async () => { await $.binnacle.notify({ plugin: b.plugin, kind: 'press', id: b.id, ...(b.row !== undefined ? { row: b.row } : {}) }) }} />)}
        </Box>
      )
    })
  },
}

/** What to mount to reach the mock's buttons: `await $.ui.mount({ plugin: 'binnacle', surface: 'terminal', ...MOCK_PANE })`. */
export const MOCK_PANE = {
  component: 'Pane' as const,
  requestId: 'binnacle-mock',
  props: { title: 'binnacle-mock', isFocused: true, bodyColumns: 100, placement: 'dock' as const, scroll: { offset: 0, bodyRows: 40 }, view: {} },
}
