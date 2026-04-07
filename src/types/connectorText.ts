import type {
  ContentBlock,
  ContentBlockParam,
} from '@anthropic-ai/sdk/resources/index.mjs'

export type ConnectorTextBlock = {
  type: 'connector_text'
  connector_text: string
  signature: string
}

export type ConnectorTextDelta = {
  type: 'connector_text_delta'
  connector_text: string
}

export function isConnectorTextBlock(
  block: ContentBlock | ContentBlockParam | { type?: string } | null | undefined,
): block is ConnectorTextBlock {
  return block?.type === 'connector_text'
}
