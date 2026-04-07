/**
 * SDK Control Types - TypeScript types for the control protocol.
 *
 * These types are derived from the Zod schemas in controlSchemas.ts and
 * define the control protocol between SDK implementations and the CLI.
 *
 * SDK consumers should use coreTypes.ts instead.
 */

import type { z } from 'zod/v4'
import type {
  SDKControlRequestSchema,
  SDKControlResponseSchema,
  SDKControlCancelRequestSchema,
  SDKControlRequestInnerSchema,
  SDKControlPermissionRequestSchema,
  SDKControlInitializeRequestSchema,
  SDKControlInitializeResponseSchema,
  SDKControlMcpSetServersResponseSchema,
  SDKControlReloadPluginsResponseSchema,
  SDKControlElicitationRequestSchema,
  SDKControlElicitationResponseSchema,
  StdoutMessageSchema,
  StdinMessageSchema,
} from './controlSchemas.js'

// ============================================================================
// Control Request Types
// ============================================================================

/** The inner request payload (discriminated union on `subtype`). */
export type SDKControlRequestInner = z.infer<ReturnType<typeof SDKControlRequestInnerSchema>>

/** A control request envelope with type, request_id, and inner request. */
export type SDKControlRequest = z.infer<ReturnType<typeof SDKControlRequestSchema>>

/** A control response envelope with type and response (success or error). */
export type SDKControlResponse = z.infer<ReturnType<typeof SDKControlResponseSchema>>

/** An initialize request (subtype: 'initialize'). */
export type SDKControlInitializeRequest = z.infer<ReturnType<typeof SDKControlInitializeRequestSchema>>

/** Response from session initialization. */
export type SDKControlInitializeResponse = z.infer<ReturnType<typeof SDKControlInitializeResponseSchema>>

/** A cancel request for an outstanding control request. */
export type SDKControlCancelRequest = z.infer<ReturnType<typeof SDKControlCancelRequestSchema>>

/** Permission request (subtype: 'can_use_tool'). */
export type SDKControlPermissionRequest = z.infer<ReturnType<typeof SDKControlPermissionRequestSchema>>

/** Response from mcp_set_servers control request. */
export type SDKControlMcpSetServersResponse = z.infer<ReturnType<typeof SDKControlMcpSetServersResponseSchema>>

/** Response from reload_plugins control request. */
export type SDKControlReloadPluginsResponse = z.infer<ReturnType<typeof SDKControlReloadPluginsResponseSchema>>

/** Elicitation request from the CLI to SDK consumer. */
export type SDKControlElicitationRequest = z.infer<ReturnType<typeof SDKControlElicitationRequestSchema>>

/** Elicitation response from SDK consumer back to CLI. */
export type SDKControlElicitationResponse = z.infer<ReturnType<typeof SDKControlElicitationResponseSchema>>

// ============================================================================
// Aggregate Message Types
// ============================================================================

/** Messages written to stdout (CLI -> SDK consumer). */
export type StdoutMessage = z.infer<ReturnType<typeof StdoutMessageSchema>>

/** Messages read from stdin (SDK consumer -> CLI). */
export type StdinMessage = z.infer<ReturnType<typeof StdinMessageSchema>>

// ============================================================================
// Partial assistant message (re-exported from core schemas)
// ============================================================================

import type { SDKPartialAssistantMessageSchema } from './coreSchemas.js'

/** Streaming partial assistant message. */
export type SDKPartialAssistantMessage = z.infer<ReturnType<typeof SDKPartialAssistantMessageSchema>>
