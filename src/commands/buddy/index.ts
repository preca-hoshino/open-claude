// Stub: commands/buddy/index.ts
import type { Command } from '../../commands.js'

const buddy = {
  type: 'local',
  name: 'buddy',
  description: 'Buddy mode (stub)',
  isEnabled: () => false,
  isHidden: true,
  supportsNonInteractive: false,
  load: () => Promise.resolve({ call: async (_args: string, _context: any) => undefined as any }),
} satisfies Command

export default buddy
