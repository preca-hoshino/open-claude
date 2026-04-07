export type Tip = {
  id: string
  content: (context?: TipContext) => Promise<string>
  cooldownSessions: number
  isRelevant: (context?: TipContext) => Promise<boolean>
}

import type { FileStateCache } from '../../utils/fileStateCache.js'
import type { ThemeName } from '../../utils/theme.js'

export type TipContext = {
  bashTools?: Set<string>
  readFileState?: FileStateCache
  theme?: ThemeName
}
