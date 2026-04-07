import { describe, expect, it, mock } from 'bun:test';
import { useMoreRight } from '../useMoreRight';

describe('useMoreRight', () => {
  it('should return default stub implementations', async () => {
    const mockArgs = {
      enabled: true,
      setMessages: mock(() => undefined),
      inputValue: 'test',
      setInputValue: mock(() => undefined),
      // biome-ignore lint/style/useNamingConvention: to match interface
      setToolJSX: mock(() => undefined),
    };

    const result = useMoreRight(mockArgs);

    expect(typeof result.onBeforeQuery).toBe('function');
    expect(typeof result.onTurnComplete).toBe('function');
    expect(typeof result.render).toBe('function');

    await expect(result.onBeforeQuery('input', [], 1)).resolves.toBe(true);
    await expect(result.onTurnComplete([], false)).resolves.toBeUndefined();
    expect(result.render()).toBeNull();
  });
});
