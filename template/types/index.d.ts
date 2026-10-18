/** This plugin's own state (a plugin that keeps atoms must declare them here: binnacle docs/plugins.md §5). */
export type BinnacleHello = Record<string, never>
declare module 'claude-code' {
  interface PluginState {
    'binnacle-hello': { presses: number }
  }
}
