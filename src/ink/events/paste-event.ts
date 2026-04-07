import { TerminalEvent } from './terminal-event.js'

/**
 * Event dispatched when text is pasted via bracketed paste mode.
 */
export class PasteEvent extends TerminalEvent {
  readonly text: string

  constructor(text: string) {
    super('paste', { bubbles: true, cancelable: true })
    this.text = text
  }
}
