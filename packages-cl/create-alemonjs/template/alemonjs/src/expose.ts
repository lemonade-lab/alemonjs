import { Expose, runHandler } from 'alemonjs';
import { helpStore } from './store';

const expose = Expose.create();

expose.provide({
    name: 'help-image',
    description: '帮助图片生成',
    actions: {
        read: {
            description: '获取帮助图片标题',
            returns: { name: 'string' },
            handler: () => helpStore.get('name')
        },
        write: {
            description: '修改帮助图片标题',
            params: { name: 'string' },
            handler: (name: string) => {
                helpStore.set('name', name);
            }
        }
    }
})

expose.provide({
    name: 'help-send',
    description: '允许你帮我发帮助，前提是携带自己的event',
    actions: {
        send: {
            description: '发送帮助',
            params: { event: 'object' },
            handler: (event) => {
                if (!event || typeof event !== 'object') {
                    return
                }
                // 消费路由
                runHandler(() => import('./response/hello'), [event, () => { }]);
            }
        }
    }
})

export default expose;
