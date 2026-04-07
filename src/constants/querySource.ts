/**
 * QuerySource identifies the origin of an API query for analytics,
 * caching, and retry-policy decisions.
 *
 * This is a branded string type — callers can use literal strings and
 * `as QuerySource` for dynamic values (e.g. agent:builtin:${name}).
 */

export type QuerySource =
  // Main REPL thread
  | 'repl_main_thread'
  | `repl_main_thread:outputStyle:${string}`
  // SDK
  | 'sdk'
  // Agent sources
  | 'agent:default'
  | 'agent:custom'
  | 'agent:builtin'
  | `agent:builtin:${string}`
  // Compact / context management
  | 'compact'
  // Hook execution
  | 'hook_agent'
  | 'hook_prompt'
  // Side queries
  | 'side_question'
  // Auto mode / classifiers
  | 'auto_mode'
  | 'auto_mode_critique'
  | 'bash_classifier'
  // Verification
  | 'verification_agent'
  // Background / utility queries
  | 'prompt_suggestion'
  | 'speculation'
  | 'magic_docs'
  | 'tool_use_summary_generation'
  | 'auto_dream'
  | 'session_memory'
  | 'away_summary'
  | 'extract_memories'
  | 'agent_summary'
  | 'model_validation'
  | 'agent_creation'
  | 'skill_improvement_apply'
  | 'rename_generate_name'
  | 'insights'
  | 'bash_extract_prefix'
  | 'permission_explainer'
  | 'web_fetch_apply'
  | 'web_search_tool'
  | 'mcp_datetime_parse'
  | 'session_search'
  | 'chrome_mcp'
  | 'generate_session_title'
  | 'memdir_relevance'
  // Catch-all for dynamic sources
  | (string & {})
