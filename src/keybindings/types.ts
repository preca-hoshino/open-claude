/**
 * Types for the keybinding system.
 *
 * These types define the structure of parsed keybindings, keystroke
 * representations, and the context names used for scoping bindings.
 */

/**
 * A parsed representation of a single keystroke (e.g. "ctrl+shift+k").
 */
export type ParsedKeystroke = {
  key: string
  ctrl: boolean
  alt: boolean
  shift: boolean
  meta: boolean
  super: boolean
}

/**
 * A parsed binding associates a chord (sequence of keystrokes) with an
 * action in a specific context.
 */
export type ParsedBinding = {
  chord: ParsedKeystroke[]
  action: string
  context: KeybindingContextName
}

/**
 * Valid context names that scope keybinding resolution.
 * A binding only matches when its context is in the active context set.
 */
export type KeybindingContextName =
  | 'Global'
  | 'Chat'
  | 'Autocomplete'
  | 'Confirmation'
  | 'Help'
  | 'Transcript'
  | 'HistorySearch'
  | 'Task'
  | 'ThemePicker'
  | 'Settings'
  | 'Tabs'
  | 'Attachments'
  | 'Footer'
  | 'MessageSelector'
  | 'DiffDialog'
  | 'ModelPicker'
  | 'Select'
  | 'Plugin'

/**
 * A keybinding action string (e.g. "app:toggleTranscript", "command:help").
 * Actions are either built-in (app:*) or user-defined (command:*).
 */
export type KeybindingAction = string

/**
 * A chord is a sequence of keystrokes that must be pressed in order.
 */
export type Chord = ParsedKeystroke[]

/**
 * A keybinding block from the user's keybindings.json configuration.
 * Each block scopes a set of key-to-action bindings to a context.
 */
export type KeybindingBlock = {
  context: string
  bindings: Record<string, string | null>
}
