import { Text, useMessage } from 'alemonjs';

export const regular = /^(#|\/)?hello$/;

const selects = onSelects(['message.create', 'private.message.create']);

// 第一个响应 - 发送问候消息
const greetingResponse = onResponse(selects, (event, _next) => {
  const [message] = useMessage(event);
  message.send(format(Text('Hello! 你好呀！👋')));
  return true;
});

// 第二个响应 - 发送帮助信息
const helpResponse = onResponse(selects, (event, _next) => {
  const [message] = useMessage(event);
  message.send(format(Text('我是你的智能助手，有什么可以帮到你的吗？')));
  return true;
});

// 第三个响应 - 发送提示信息（修复：保持返回类型一致）
const tipResponse = onResponse(selects, (event, _next) => {
  const [message] = useMessage(event);
  message.send(format(Text('💡 小提示：你可以尝试输入其他指令来体验更多功能！')));
  return true; // 修复：保持与其他响应相同的返回类型
});

// 👇 演示：故意使用错误的selects，TypeScript会显示类型错误
const wrongResponse = onResponse(['channal.create'], (event, _next) => {
  const [message] = useMessage(event);
  message.send(format(Text('这个响应使用了错误的selects')));
});

const group = onGroup(
  greetingResponse,
  helpResponse,
  tipResponse
  // wrongResponse
);

export default group;
