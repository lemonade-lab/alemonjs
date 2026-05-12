import { checkFallbackHint } from '../../../packages/alemonjs/src/app/router/fallback';

describe('checkFallbackHint', () => {
  it('does not treat normal chat that only shares the same prefix as a command attempt', () => {
    const result = checkFallbackHint('我是莫某', ['我']);

    expect(result).toEqual({ matched: false });
  });

  it('still suggests when the command key is followed by whitespace', () => {
    const result = checkFallbackHint('我 是 张三', ['我']);

    expect(result.matched).toBe(true);
    expect(result.suggestedKey).toBe('我');
  });

  it('still suggests when a multi-word command key is followed by parameters', () => {
    const result = checkFallbackHint('我是 张三', ['我是']);

    expect(result.matched).toBe(true);
    expect(result.suggestedKey).toBe('我是');
  });
});
