import { validateRouteArgsForCommand } from '../../../packages/alemonjs/src/application/router/validator';

describe('validateRouteArgsForCommand', () => {
  it('uses arg name in required validation errors', () => {
    const result = validateRouteArgsForCommand('我是', [], {
      usage: '我是 <名字>',
      args: [
        {
          name: '名字',
          rules: [{ required: true }]
        }
      ]
    });

    expect(result).toEqual({
      valid: false,
      error: '参数「名字」是必填的',
      usage: '我是 <名字>'
    });
  });

  it('uses arg name in typed validation errors', () => {
    const result = validateRouteArgsForCommand('等级', ['abc'], {
      usage: '等级 <数值>',
      args: [
        {
          name: '数值',
          rules: [{ required: true }, { type: 'number' }]
        }
      ]
    });

    expect(result).toEqual({
      valid: false,
      error: '参数「数值」必须是数字',
      usage: '等级 <数值>'
    });
  });
});
