export type Terminal = {
  reason:
    | 'completed'
    | 'aborted_streaming'
    | 'aborted_tools'
    | 'model_error'
    | 'prompt_too_long'
    | 'image_error'
    | 'max_turns'
    | 'blocking_limit'
    | 'hook_stopped'
    | 'stop_hook_prevented'
  error?: unknown
  turnCount?: number
}

export type Continue = {
  reason:
    | 'next_turn'
    | 'reactive_compact_retry'
    | 'max_output_tokens_escalate'
    | 'stop_hook_blocking'
    | 'token_budget_continuation'
    | 'auto_compact'
    | 'collapse_drain_retry'
    | 'max_output_tokens_recovery'
  committed?: number
  attempt?: number
}
