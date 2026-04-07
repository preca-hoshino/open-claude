/**
 * Types for Jupyter notebook parsing and editing.
 */

export type NotebookCellType = 'code' | 'markdown' | 'raw'

export type NotebookOutputImage = {
  image_data: string
  media_type: 'image/png' | 'image/jpeg'
}

export type NotebookCellOutput = {
  output_type: 'stream' | 'execute_result' | 'display_data' | 'error'
  text?: string | string[]
  data?: Record<string, unknown>
  ename?: string
  evalue?: string
  traceback?: string[]
}

export type NotebookCell = {
  cell_type: NotebookCellType
  source: string | string[]
  id?: string
  outputs?: NotebookCellOutput[]
  execution_count?: number | null
  metadata?: Record<string, unknown>
}

export type NotebookCellSourceOutput = {
  output_type: string
  text?: string
  image?: NotebookOutputImage
}

export type NotebookCellSource = {
  cellType: NotebookCellType
  source: string
  cell_id: string
  language?: string
  execution_count?: number
  outputs?: NotebookCellSourceOutput[]
}

export type NotebookContent = {
  cells: NotebookCell[]
  metadata?: {
    kernelspec?: {
      language?: string
      display_name?: string
      name?: string
    }
    language_info?: {
      name?: string
    }
    [key: string]: unknown
  }
  nbformat?: number
  nbformat_minor?: number
}
