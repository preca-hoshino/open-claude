import type { Command } from '../../types/command.js'

export const resetLimits: Command = {
  type: 'local',
  name: 'reset-limits',
  description: 'Reset rate limits (internal)',
  supportsNonInteractive: false,
  isHidden: true,
  load: async () => ({
    call: async () => ({ type: 'text' as const, value: 'Not available in source build' }),
  }),
}

export const resetLimitsNonInteractive: Command = {
  type: 'local',
  name: 'reset-limits-non-interactive',
  description: 'Reset rate limits non-interactive (internal)',
  supportsNonInteractive: true,
  isHidden: true,
  load: async () => ({
    call: async () => ({ type: 'text' as const, value: 'Not available in source build' }),
  }),
}
