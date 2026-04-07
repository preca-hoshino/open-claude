import type { Command } from '../../types/command.js'

const command: Command = {
  type: 'local',
  name: 'bughunter',
  description: 'bughunter (internal)',
  supportsNonInteractive: false,
  isHidden: true,
  load: async () => ({
    call: async () => ({ type: 'text' as const, value: 'Not available in source build' }),
  }),
}

export default command
