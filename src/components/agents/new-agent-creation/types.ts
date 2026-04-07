import type { AgentColorName } from '../../../tools/AgentTool/agentColorManager.js'
import type { AgentMemoryScope } from '../../../tools/AgentTool/agentMemory.js'
import type { CustomAgentDefinition } from '../../../tools/AgentTool/loadAgentsDir.js'
import type { SettingSource } from '../../../utils/settings/constants.js'

export type AgentWizardData = {
  location?: SettingSource
  method?: 'generate' | 'manual'
  wasGenerated?: boolean
  generationPrompt?: string
  isGenerating?: boolean
  generatedAgent?: {
    identifier: string
    whenToUse: string
    systemPrompt: string
  }
  agentType?: string
  systemPrompt?: string
  whenToUse?: string
  selectedTools?: string[]
  selectedModel?: string
  selectedColor?: AgentColorName
  selectedMemory?: AgentMemoryScope
  memoryScope?: AgentMemoryScope | 'none'
  memory?: AgentMemoryScope
  tools?: string[]
  model?: string
  finalAgent?: CustomAgentDefinition
}
