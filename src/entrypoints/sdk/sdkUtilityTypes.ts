/**
 * SDK Utility Types - Types that can't be expressed as Zod schemas.
 *
 * These are hand-written types used by SDK internals (logging, usage tracking).
 */

/**
 * A usage object where all numeric fields are guaranteed non-null.
 * Used for internal accumulation where we always start from zero.
 */
export type NonNullableUsage = {
  input_tokens: number
  cache_creation_input_tokens: number
  cache_read_input_tokens: number
  output_tokens: number
  server_tool_use: {
    web_search_requests: number
    web_fetch_requests: number
  }
  service_tier: string
  cache_creation: {
    ephemeral_1h_input_tokens: number
    ephemeral_5m_input_tokens: number
  }
  inference_geo: string
  iterations: unknown[]
  speed: string
}
