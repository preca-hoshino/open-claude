/**
 * Types for the message queue operation logging system.
 *
 * QueueOperationMessage records are appended to session JSONL files
 * to track command queue mutations for debugging and replay.
 */

export type QueueOperation =
  | 'enqueue'
  | 'dequeue'
  | 'clear'
  | 'cancel'
  | 'reorder'
  | 'enqueue_notification'
  | 'dequeue_notification'
  | 'remove'
  | 'popAll'

export type QueueOperationMessage = {
  type: 'queue-operation'
  operation: QueueOperation
  timestamp: string
  sessionId: string
  content?: string
}
