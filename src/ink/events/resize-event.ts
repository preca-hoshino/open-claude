import { TerminalEvent } from './terminal-event.js'

/**
 * Event dispatched when the terminal window is resized.
 */
export class ResizeEvent extends TerminalEvent {
  readonly columns: number
  readonly rows: number

  constructor(columns: number, rows: number) {
    super('resize', { bubbles: true, cancelable: false })
    this.columns = columns
    this.rows = rows
  }
}
