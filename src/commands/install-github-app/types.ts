export type Workflow = 'claude' | 'claude-review'

export interface Warning {
  title: string
  message: string
  instructions?: string[]
}

export interface State {
  step: string
  selectedRepoName: string
  currentRepo: string
  useCurrentRepo: boolean
  apiKeyOrOAuthToken: string
  useExistingKey: boolean
  currentWorkflowInstallStep: number
  warnings: Warning[]
  secretExists: boolean
  secretName: string
  useExistingSecret: boolean
  workflowExists: boolean
  selectedWorkflows: Workflow[]
  selectedApiKeyOption: 'existing' | 'new' | 'oauth'
  authType: string
  workflowAction?: 'install' | 'update' | 'skip'
  error?: string
  errorReason?: string
  errorInstructions?: string[]
}
