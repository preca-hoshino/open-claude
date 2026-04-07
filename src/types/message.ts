/**
 * Core message types for Claude Code.
 *
 * This file defines the internal message protocol — every message flowing
 * through the query loop, REPL, compact pipeline, and SDK bridge is typed here.
 *
 * Reconstructed from 183 import sites across the codebase.
 */

import type {
  BetaContentBlock,
  BetaMessage,
  BetaToolUseBlock,
} from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/index.mjs'
import type { APIError } from '@anthropic-ai/sdk'
// Widen UUID to plain string to avoid template-literal mismatches
type UUID = string
import type { SDKAssistantMessageError } from '../entrypoints/agentSdkTypes.js'
import type { Progress } from '../Tool.js'
import type { Attachment } from '../utils/attachments.js'
import type { PermissionMode } from './permissions.js'

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/**
 * Provenance tag for user messages.
 * - 'human'           — keyboard input
 * - 'channel'         — MCP server channel message
 * - 'task-notification' — background agent task notification
 * - 'coordinator'     — coordinator agent message
 */
export type MessageOrigin =
  | { kind: 'human' }
  | { kind: 'channel'; server: string }
  | { kind: 'task-notification' }
  | { kind: 'coordinator' }

/**
 * Severity level for system messages displayed in the REPL.
 */
export type SystemMessageLevel = 'info' | 'warning' | 'error' | 'suggestion'

/**
 * Direction hint for partial compaction.
 * - 'from'  — compact from the beginning of the conversation
 * - 'up_to' — compact up to a specific point
 */
export type PartialCompactDirection = 'from' | 'up_to'

/**
 * Information about a hook that ran at stop time.
 */
export type StopHookInfo = {
  command: string
  promptText?: string
  durationMs?: number
}

/**
 * Metadata attached to compact boundary messages.
 */
export type CompactMetadata = {
  trigger: 'manual' | 'auto'
  preTokens: number
  userContext?: string
  messagesSummarized?: number
  preservedSegment?: {
    headUuid: string
    anchorUuid: string
    tailUuid: string
  }
  preCompactDiscoveredTools?: string[]
}

// ---------------------------------------------------------------------------
// Base message fields
// ---------------------------------------------------------------------------

interface BaseMessageFields {
  uuid: UUID | string
  timestamp: string
}

// ---------------------------------------------------------------------------
// User messages
// ---------------------------------------------------------------------------

export interface UserMessage extends BaseMessageFields {
  type: 'user'
  message: {
    role: 'user'
    content: string | ContentBlockParam[]
  }
  isMeta?: true
  isVisibleInTranscriptOnly?: true
  isVirtual?: true
  isCompactSummary?: true
  summarizeMetadata?: {
    messagesSummarized: number
    userContext?: string
    direction?: PartialCompactDirection
  }
  toolUseResult?: unknown
  mcpMeta?: {
    _meta?: Record<string, unknown>
    structuredContent?: Record<string, unknown>
  }
  imagePasteIds?: number[]
  sourceToolAssistantUUID?: UUID | string
  permissionMode?: PermissionMode
  origin?: MessageOrigin
}

// ---------------------------------------------------------------------------
// Assistant messages
// ---------------------------------------------------------------------------

export interface AssistantMessage extends BaseMessageFields {
  type: 'assistant'
  message: BetaMessage
  requestId?: string
  isApiErrorMessage?: boolean
  apiError?: string
  error?: SDKAssistantMessageError
  errorDetails?: string
  isMeta?: true
  isVirtual?: true
  advisorModel?: string
  research?: unknown
}

// ---------------------------------------------------------------------------
// Progress messages
// ---------------------------------------------------------------------------

export interface ProgressMessage<P extends Progress = Progress>
  extends BaseMessageFields {
  type: 'progress'
  data: P
  toolUseID: string
  parentToolUseID: string
}

// ---------------------------------------------------------------------------
// Attachment messages
// ---------------------------------------------------------------------------

export interface AttachmentMessage<A extends Attachment = Attachment>
  extends BaseMessageFields {
  type: 'attachment'
  attachment: A
}

/**
 * A hook result message can be an attachment or progress message — hooks
 * produce both types during execution.
 */
export type HookResultMessage = AttachmentMessage | ProgressMessage

// ---------------------------------------------------------------------------
// System messages (discriminated union on `subtype`)
// ---------------------------------------------------------------------------

interface SystemMessageBase extends BaseMessageFields {
  type: 'system'
  isMeta?: boolean
}

export interface SystemInformationalMessage extends SystemMessageBase {
  subtype: 'informational'
  content: string
  level: SystemMessageLevel
  toolUseID?: string
  preventContinuation?: boolean
}

export interface SystemAPIErrorMessage extends SystemMessageBase {
  subtype: 'api_error'
  level: 'error'
  error: APIError
  cause?: Error
  retryInMs: number
  retryAttempt: number
  maxRetries: number
}

export interface SystemPermissionRetryMessage extends SystemMessageBase {
  subtype: 'permission_retry'
  content: string
  commands: string[]
  level: SystemMessageLevel
}

export interface SystemBridgeStatusMessage extends SystemMessageBase {
  subtype: 'bridge_status'
  content: string
  url: string
  upgradeNudge?: string
}

export interface SystemScheduledTaskFireMessage extends SystemMessageBase {
  subtype: 'scheduled_task_fire'
  content: string
}

export interface SystemStopHookSummaryMessage extends SystemMessageBase {
  subtype: 'stop_hook_summary'
  hookCount: number
  hookInfos: StopHookInfo[]
  hookErrors: string[]
  preventedContinuation: boolean
  stopReason: string | undefined
  hasOutput: boolean
  level: SystemMessageLevel
  toolUseID?: string
  hookLabel?: string
  totalDurationMs?: number
}

export interface SystemTurnDurationMessage extends SystemMessageBase {
  subtype: 'turn_duration'
  durationMs: number
  budgetTokens?: number
  budgetLimit?: number
  budgetNudges?: number
  messageCount?: number
}

export interface SystemAwaySummaryMessage extends SystemMessageBase {
  subtype: 'away_summary'
  content: string
}

export interface SystemMemorySavedMessage extends SystemMessageBase {
  subtype: 'memory_saved'
  writtenPaths: string[]
  teamCount?: number
}

export interface SystemAgentsKilledMessage extends SystemMessageBase {
  subtype: 'agents_killed'
}

export interface SystemApiMetricsMessage extends SystemMessageBase {
  subtype: 'api_metrics'
  ttftMs: number
  otps: number
  isP50?: boolean
  hookDurationMs?: number
  turnDurationMs?: number
  toolDurationMs?: number
  classifierDurationMs?: number
  toolCount?: number
  hookCount?: number
  classifierCount?: number
  configWriteCount?: number
}

export interface SystemLocalCommandMessage extends SystemMessageBase {
  subtype: 'local_command'
  content: string
  level: SystemMessageLevel
}

export interface SystemCompactBoundaryMessage extends SystemMessageBase {
  subtype: 'compact_boundary'
  content: string
  level: SystemMessageLevel
  compactMetadata: CompactMetadata
  logicalParentUuid?: UUID
}

export interface SystemMicrocompactBoundaryMessage extends SystemMessageBase {
  subtype: 'microcompact_boundary'
  content: string
  level: SystemMessageLevel
  microcompactMetadata: {
    trigger: 'auto'
    preTokens: number
    tokensSaved: number
    compactedToolIds: string[]
    clearedAttachmentUUIDs: string[]
  }
}

export interface SystemThinkingMessage extends SystemMessageBase {
  subtype: 'thinking'
}

export interface SystemFileSnapshotMessage extends SystemMessageBase {
  subtype: 'file_snapshot'
  content: string
  level: SystemMessageLevel
  snapshotFiles: Array<{
    key: string
    path: string
    content: string
  }>
}

/**
 * Discriminated union of all system message subtypes.
 */
export type SystemMessage =
  | SystemInformationalMessage
  | SystemAPIErrorMessage
  | SystemPermissionRetryMessage
  | SystemBridgeStatusMessage
  | SystemScheduledTaskFireMessage
  | SystemStopHookSummaryMessage
  | SystemTurnDurationMessage
  | SystemAwaySummaryMessage
  | SystemMemorySavedMessage
  | SystemAgentsKilledMessage
  | SystemApiMetricsMessage
  | SystemLocalCommandMessage
  | SystemCompactBoundaryMessage
  | SystemMicrocompactBoundaryMessage
  | SystemThinkingMessage
  | SystemFileSnapshotMessage

// ---------------------------------------------------------------------------
// Aggregate message type
// ---------------------------------------------------------------------------

/**
 * Any message that can appear in the conversation message array.
 */
export type Message =
  | UserMessage
  | AssistantMessage
  | ProgressMessage
  | AttachmentMessage
  | SystemMessage

// ---------------------------------------------------------------------------
// Normalized messages (single content block per message)
// ---------------------------------------------------------------------------

/**
 * A user message with content normalised to a single-element array.
 */
export type NormalizedUserMessage = Omit<UserMessage, 'message'> & {
  message: {
    role: 'user'
    content: ContentBlockParam[]
  }
  sourceToolUseID?: string
}

/**
 * An assistant message with content normalised to a single content block.
 */
export type NormalizedAssistantMessage<
  T extends BetaContentBlock = BetaContentBlock,
> = Omit<AssistantMessage, 'message'> & {
  message: Omit<BetaMessage, 'content'> & {
    content: [T]
  }
}

/**
 * Union of all normalised message types.
 */
export type NormalizedMessage =
  | NormalizedUserMessage
  | NormalizedAssistantMessage
  | ProgressMessage
  | AttachmentMessage
  | SystemMessage

// ---------------------------------------------------------------------------
// Stream / query-loop event types
// ---------------------------------------------------------------------------

/**
 * Wrapper around a raw Anthropic stream event, yielded by the streaming
 * API client and consumed by handleMessageFromStream.
 */
export interface StreamEvent {
  type: 'stream_event'
  event: any // BetaRawMessageStreamEvent — typed as any to avoid downstream narrowing conflicts
  ttftMs?: number
}

/**
 * Emitted at the start of each API request in the query loop.
 */
export interface RequestStartEvent {
  type: 'stream_request_start'
}

/**
 * A tombstone message marks an existing message for removal.
 * Used to retract a previously-emitted message (e.g. from VCR replay).
 */
export interface TombstoneMessage {
  type: 'tombstone'
  message: Message
}

/**
 * A summary of tool uses, emitted for SDK consumers after a tool batch completes.
 */
export interface ToolUseSummaryMessage extends BaseMessageFields {
  type: 'tool_use_summary'
  summary: string
  precedingToolUseIds: string[]
}

// ---------------------------------------------------------------------------
// Renderable / UI message types
// ---------------------------------------------------------------------------

/**
 * A collapsible message is any normalised message that the collapse pipeline
 * may absorb into a CollapsedReadSearchGroup. In practice this is tool_use
 * assistant messages, grouped tool uses, or their matching tool_result user messages.
 */
export type CollapsibleMessage =
  | NormalizedAssistantMessage
  | NormalizedUserMessage
  | GroupedToolUseMessage

/**
 * Multiple tool uses of the same type from a single API response,
 * grouped for compact UI rendering.
 */
export interface GroupedToolUseMessage {
  type: 'grouped_tool_use'
  toolName: string
  messages: NormalizedAssistantMessage<BetaToolUseBlock>[]
  results: NormalizedUserMessage[]
  displayMessage: NormalizedAssistantMessage<BetaToolUseBlock>
  uuid: string
  timestamp: string
  messageId: string
}

/**
 * A collapsed group of consecutive read/search tool operations,
 * rendered as a single summary line in the REPL.
 */
export interface CollapsedReadSearchGroup {
  type: 'collapsed_read_search'
  searchCount: number
  readCount: number
  listCount: number
  replCount: number
  memorySearchCount: number
  memoryReadCount: number
  memoryWriteCount: number
  readFilePaths: Set<string>
  searchArgs: Array<{ pattern?: string; glob?: string; path?: string }>
  latestDisplayHint?: string
  messages: CollapsibleMessage[]
  displayMessage: NormalizedAssistantMessage | NormalizedUserMessage
  uuid: UUID | string
  timestamp: string
  // Optional fields set conditionally:
  teamMemorySearchCount?: number
  teamMemoryReadCount?: number
  teamMemoryWriteCount?: number
  mcpCallCount?: number
  mcpServerNames?: string[]
  bashCount?: number
  gitOpBashCount?: number
  commits?: Array<{ kind: string; sha: string }>
  pushes?: Array<{ branch: string }>
  branches?: Array<{ action: string; ref: string }>
  prs?: Array<{ action: string; number: number; url?: string }>
  hookTotalMs?: number
  hookCount?: number
  hookInfos?: StopHookInfo[]
  relevantMemories?: Array<{ path: string; content: string }>
}

/**
 * Any message type that the rendering pipeline can produce.
 * This is the union passed to MessageRow and VirtualMessageList.
 */
export type RenderableMessage =
  | NormalizedMessage
  | GroupedToolUseMessage
  | CollapsedReadSearchGroup
