// biome-ignore lint/style/useFilenamingConvention: matches component name
import { describe, expect, it, mock } from 'bun:test';
import { AssistantSessionChooser } from '../AssistantSessionChooser';

describe('AssistantSessionChooser', () => {
  it('should render ink-text with AssistantSessionChooser stub', () => {
    const onSelect = mock();
    const onCancel = mock();

    const element = AssistantSessionChooser({ sessions: [], onSelect, onCancel });
    const el = element as { type: string; props: { children: unknown } };
    expect(el.type).toBe('ink-text');
    expect(el.props.children).toBe('AssistantSessionChooser stub');
  });
});
