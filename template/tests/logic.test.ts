import { describe, expect, mock, test } from 'claude-code/testing'
import { greeting } from '../hooks/logic.ts'
import { MOCK_PANE, binnacleMock } from './binnacle-mock.tsx'

describe('greeting', () => {
  test('counts and shouts', () => {
    expect(greeting(1, false)).toBe('hello, once')
    expect(greeting(3, true)).toBe('HELLO, 3 TIMES')
  })
})


test('the hello button greets, louder once the setting is on', { plugins: [binnacleMock] }, async ($, on) => {
  const clock = mock.clock(on)
  const toasts: string[] = []
  on('ui.toast', (_$, e) => { toasts.push(e.text); return { value: undefined } })
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/repo', surface: 'terminal', isInteractive: true })
  expect(toasts).toContain('binnacle-mock: button binnacle-hello {"id":"hello","label":"✋ hello"}')
  const ui = await $.ui.mount({ plugin: 'binnacle', surface: 'terminal', ...MOCK_PANE })
  await ui.press({ key: 'press-binnacle-hello-hello' })
  await clock.settle()
  await ui.press({ key: 'setting-binnacle-hello-loud' })
  await clock.settle()
  await ui.press({ key: 'press-binnacle-hello-hello' })
  await clock.settle()
  await ui.unmount()
  expect(toasts.filter(t => !t.startsWith('binnacle-mock:'))).toEqual(['hello, once', 'HELLO, 2 TIMES'])
})
