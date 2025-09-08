import { commands } from './storage.js';
export const command = (command: string) => {
  // 找到命令
  const value = commands.find(c => c.command == command);

  if (value) {
    // 执行命令
    value.callback();
  }
};
