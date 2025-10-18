import { IncomingMessage } from 'http';
import { WebSocket } from 'ws';
import * as flattedJSON from 'flatted';
import { dirname, join } from 'path';
import { existsSync, readFileSync, watch, mkdirSync, writeFile } from 'fs';
import _ from 'lodash';
import { readFile } from 'fs/promises';
import type { ParsedMessage } from '../typings';
import { ResultCode } from 'core';

/**
 * @param ws
 * @param request
 */
export const createTestOneController = (ws: WebSocket, _request: IncomingMessage) => {
  // 确保目录存在
  const testonePath = join(process.cwd(), 'testone');

  if (!existsSync(testonePath)) {
    mkdirSync(testonePath, { recursive: true });
  }

  // 监听整个目录，捕获新文件创建
  const dirWatcher = watch(testonePath, { persistent: true }, (eventType, filename) => {
    if (!filename) {
      return;
    }
    // 如果是新创建的文件，开始监听它
    if (eventType === 'change') {
      if (filename === 'commands.json') {
        onCommands(); // 立即触发一次
      } else if (filename === 'users.json') {
        onUsers();
      } else if (filename === 'channels.json') {
        onChannels();
      } else if (filename === 'user.json') {
        onUser();
      } else if (filename === 'bot.json') {
        onBot();
      }
    }
  });

  const commandsPath = join(testonePath, 'commands.json');
  const onCommands = _.debounce(() => {
    if (!existsSync(commandsPath)) {
      return;
    }
    readFile(commandsPath, 'utf-8')
      .then(data => {
        const commands = JSON.parse(data);

        ws?.send(
          flattedJSON.stringify({
            type: 'commands',
            payload: commands
          })
        );
      })
      .catch(error => {
        logger.error({
          code: ResultCode.Fail,
          message: '读取 commands.json 失败',
          data: error
        });
      });
  }, 1000);

  const usersPath = join(testonePath, 'users.json');
  const onUsers = _.debounce(() => {
    if (!existsSync(usersPath)) {
      return;
    }
    readFile(usersPath, 'utf-8')
      .then(data => {
        const users = JSON.parse(data);

        ws?.send(
          flattedJSON.stringify({
            type: 'users',
            payload: users
          })
        );
      })
      .catch(error => {
        logger.error({
          code: ResultCode.Fail,
          message: '读取 users.json 失败',
          data: error
        });
      });
  }, 1000);

  const channelsPath = join(testonePath, 'channels.json');
  const onChannels = _.debounce(() => {
    if (!existsSync(channelsPath)) {
      return;
    }
    readFile(channelsPath, 'utf-8')
      .then(data => {
        const channels = JSON.parse(data);

        ws?.send(
          flattedJSON.stringify({
            type: 'channels',
            payload: channels
          })
        );
      })
      .catch(error => {
        logger.error({
          code: ResultCode.Fail,
          message: '读取 channels.json 失败',
          data: error
        });
      });
  }, 1000);

  const userPath = join(testonePath, 'user.json');

  const onUser = _.debounce(() => {
    if (!existsSync(userPath)) {
      return;
    }
    readFile(userPath, 'utf-8')
      .then(data => {
        const user = JSON.parse(data);

        ws?.send(
          flattedJSON.stringify({
            type: 'user',
            payload: user
          })
        );
      })
      .catch(error => {
        logger.error({
          code: ResultCode.Fail,
          message: '读取 user.json 失败',
          data: error
        });
      });
  }, 1000);

  const botPath = join(testonePath, 'bot.json');

  const onBot = _.debounce(() => {
    if (!existsSync(botPath)) {
      return;
    }
    readFile(botPath, 'utf-8')
      .then(data => {
        const bot = JSON.parse(data);

        ws?.send(
          flattedJSON.stringify({
            type: 'bot',
            payload: bot
          })
        );
      })
      .catch(error => {
        logger.error({
          code: ResultCode.Fail,
          message: '读取 bot.json 失败',
          data: error
        });
      });
  }, 1000);

  const privateMessagePath = join(testonePath, '.cache', 'private.message.json');
  const publicMessagePath = join(testonePath, '.cache', 'public.message.json');

  const cacheDir = dirname(privateMessagePath);

  mkdirSync(cacheDir, { recursive: true });

  const initData = () => {
    try {
      const commandsData = existsSync(commandsPath) ? JSON.parse(readFileSync(commandsPath, 'utf-8')) : [];
      const usersData = existsSync(usersPath) ? JSON.parse(readFileSync(usersPath, 'utf-8')) : [];
      const channelsData = existsSync(channelsPath) ? JSON.parse(readFileSync(channelsPath, 'utf-8')) : [];
      const userData = existsSync(userPath) ? JSON.parse(readFileSync(userPath, 'utf-8')) : null;
      const botData = existsSync(botPath) ? JSON.parse(readFileSync(botPath, 'utf-8')) : null;
      const privateMessage = existsSync(privateMessagePath) ? JSON.parse(readFileSync(privateMessagePath, 'utf-8')) : [];
      const publicMessage = existsSync(publicMessagePath) ? JSON.parse(readFileSync(publicMessagePath, 'utf-8')) : [];

      ws?.send(
        flattedJSON.stringify({
          type: 'init.data',
          payload: {
            commands: commandsData,
            users: usersData,
            channels: channelsData,
            user: userData,
            bot: botData,
            privateMessage: privateMessage,
            publicMessage: publicMessage
          }
        })
      );
    } catch (error) {
      logger.error({
        code: ResultCode.Fail,
        message: '初始化数据失败',
        data: error
      });
    }
  };

  const onDeleteMessage = (type: 'private' | 'public', CreateAt: number) => {
    const messagePath = type === 'private' ? privateMessagePath : publicMessagePath;

    if (existsSync(messagePath)) {
      try {
        const messages = JSON.parse(readFileSync(messagePath, 'utf-8'));
        const updatedMessages = messages.filter((msg: any) => msg.CreateAt !== CreateAt);

        writeFile(messagePath, JSON.stringify(updatedMessages, null, 2), error => {
          if (error) {
            logger.error({
              code: ResultCode.Fail,
              message: `写入 ${type} 消息失败`,
              data: error
            });
          }
        });
      } catch (error) {
        logger.error({
          code: ResultCode.Fail,
          message: `读取 ${type} 消息失败`,
          data: error
        });
      }
    }
  };

  const onSaveMessage = (type: 'private' | 'public', message: any) => {
    const messagePath = type === 'private' ? privateMessagePath : publicMessagePath;
    const messages = existsSync(messagePath) ? JSON.parse(readFileSync(messagePath, 'utf-8')) : [];

    messages.push(message);
    writeFile(messagePath, JSON.stringify(messages, null, 2), error => {
      if (error) {
        logger.error({
          code: ResultCode.Fail,
          message: `写入 ${type} 消息失败`,
          data: error
        });
      }
    });
  };

  const controller = {
    onMessage: (parsedMessage: ParsedMessage) => {
      if (parsedMessage.type === 'init.data') {
        initData();
      } else if (parsedMessage.type === 'commands') {
        onCommands();
      } else if (parsedMessage.type === 'users') {
        onUsers();
      } else if (parsedMessage.type === 'channels') {
        onChannels();
      } else if (parsedMessage.type === 'user') {
        onUser();
      } else if (parsedMessage.type === 'bot') {
        onBot();
      } else if (parsedMessage.type === 'private.message.delete') {
        const CreateAt = parsedMessage.payload.CreateAt;

        onDeleteMessage('private', CreateAt);
      } else if (parsedMessage.type === 'public.message.delete') {
        const CreateAt = parsedMessage.payload.CreateAt;

        onDeleteMessage('public', CreateAt);
      } else if (parsedMessage.type === 'private.message.save') {
        onSaveMessage('private', parsedMessage.payload);
      } else if (parsedMessage.type === 'public.message.save') {
        onSaveMessage('public', parsedMessage.payload);
      }
    },
    close: () => {
      logger.info({
        code: ResultCode.Ok,
        message: 'WebSocket connection closed',
        data: null
      });
      dirWatcher.close();
    },
    error: (err: Error) => {
      logger.error({
        code: ResultCode.Fail,
        message: 'WebSocket error:',
        data: err
      });
      dirWatcher.close();
    }
  };

  return controller;
};
