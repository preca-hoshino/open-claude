/**
 * Types for the file suggestion hook command input.
 *
 * FileSuggestionCommandInput is the shape passed to custom fileSuggestion
 * commands configured in settings, extending the base hook input with
 * the current typeahead query.
 */

export type FileSuggestionCommandInput = {
  // Base hook input fields
  session_id: string
  transcript_path: string
  cwd: string
  permission_mode?: string
  agent_id?: string
  agent_type?: string

  // File suggestion specific fields
  query: string
}
