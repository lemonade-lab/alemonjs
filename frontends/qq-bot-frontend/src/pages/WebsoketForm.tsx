import { Button, Input, Select } from '@alemonjs/react-ui';
import React, { useEffect, useState } from 'react';

export default function WebsoketForm() {
  const [formData, setFormData] = useState({
    app_id: '',
    token: '',
    secret: '',
    master_key: '',
    mode: 'group',
    sandbox: false,
    markdownToText: false,
    hideUnsupported: '',
    default_bot: '',
    bots_json: ''
  });
  const [connectionStatus, setConnectionStatus] = useState<any>();

  useEffect(() => {
    if (!window.createDesktopAPI) return;
    const API = window.createDesktopAPI();
    window.API = API;

    // 获取消息
    API.postMessage({
      type: 'qq-bot.init'
    });
    API.postMessage({ type: 'qq-bot.status' });
    API.onMessage(data => {
      if (data.type === 'qq-bot.init') {
        const db = data.data;
        setFormData({
          app_id: db.app_id || '',
          token: db.token || '',
          secret: db.secret || '',
          mode: db.mode || 'group',
          sandbox: db.sandbox || false,
          master_key: Array.isArray(db?.master_key) ? db.master_key.join(',') : '',
          markdownToText: db.markdownToText || false,
          hideUnsupported: db?.hideUnsupported ?? '',
          default_bot: db.default_bot || '',
          bots_json: db.bots ? JSON.stringify(db.bots, null, 2) : ''
        });
      } else if (data.type === 'qq-bot.status') {
        setConnectionStatus(data.data);
      }
    });
    const timer = setInterval(() => API.postMessage({ type: 'qq-bot.status' }), 5_000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? e.target.checked : value
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let bots: Record<string, unknown> | undefined;
    try {
      bots = formData.bots_json.trim() ? JSON.parse(formData.bots_json) : undefined;
    } catch {
      window.alert('Bots JSON 格式无效');
      return;
    }
    window.API.postMessage({
      type: 'qq-bot.form.save',
      data: { ...formData, bots, bots_json: undefined }
    });
  };

  return (
    <form onSubmit={handleSubmit} className='py-4 space-y-4'>
      <div>
        <label className='block text-sm font-medium '>App ID</label>
        <Input
          type='text'
          id='app_id'
          name='app_id'
          value={formData.app_id}
          onChange={handleChange}
          className='mt-1 block w-full p-2 border  rounded-md focus:outline-none focus:ring '
        />
      </div>
      <div>
        <label className='block text-sm font-medium '>Token</label>
        <Input
          type='text'
          id='token'
          name='token'
          value={formData.token}
          onChange={handleChange}
          className='mt-1 block w-full p-2 border  rounded-md focus:outline-none focus:ring '
        />
      </div>
      <div>
        <label className='block text-sm font-medium '>Secret</label>
        <Input
          type='text'
          id='secret'
          name='secret'
          value={formData.secret}
          onChange={handleChange}
          className='mt-1 block w-full p-2 border  rounded-md focus:outline-none focus:ring '
        />
      </div>
      <div>
        <label className='block text-sm font-medium '>Default Bot（多 Bot 主动发送必填）</label>
        <Input type='text' name='default_bot' value={formData.default_bot} onChange={handleChange} className='mt-1 block w-full p-2 border rounded-md' />
      </div>
      <div>
        <label className='block text-sm font-medium '>Bots JSON（键必须等于 App ID，仅 WebSocket）</label>
        <textarea
          name='bots_json'
          value={formData.bots_json}
          onChange={handleChange}
          rows={7}
          className='mt-1 block w-full p-2 border rounded-md font-mono text-xs'
          placeholder={'{\n  "app_id": { "secret": "..." }\n}'}
        />
      </div>
      <div>
        <label className='block text-sm font-medium '>连接状态</label>
        <pre className='mt-1 max-h-40 overflow-auto rounded-md border p-2 text-xs'>
          {JSON.stringify(connectionStatus ?? { state: 'stopped', bots: [] }, null, 2)}
        </pre>
      </div>
      <div>
        <label className='block text-sm font-medium '>Master Key</label>
        <Input
          type='text'
          id='master_key'
          name='master_key'
          value={formData.master_key}
          placeholder='123456,456789,345678'
          onChange={handleChange}
          className='mt-1 block w-full p-2 border  rounded-md focus:outline-none focus:ring '
        />
      </div>
      <div>
        <label className='block text-sm font-medium '>Mode</label>
        <Select value={formData.mode} id='mode' name='mode' onChange={handleChange as any} className='w-full p-2 rounded-md border focus:outline-none'>
          <option value='group'>group</option>
          <option value='guild'>guild</option>
          <option value='all'>all</option>
        </Select>
      </div>
      <div>
        <label className='inline-flex items-center'>
          <Input type='checkbox' id='sandbox' name='sandbox' checked={formData.sandbox} onChange={handleChange} className='mr-2' />
          Sandbox
        </label>
      </div>
      <div>
        <label className='inline-flex items-center'>
          <Input type='checkbox' id='markdownToText' name='markdownToText' checked={formData.markdownToText} onChange={handleChange} className='mr-2' />
          Markdown To Text
        </label>
      </div>
      <div>
        <label className='block text-sm font-medium '>Hide Unsupported</label>
        <Select
          id='hideUnsupported'
          name='hideUnsupported'
          value={formData.hideUnsupported}
          onChange={handleChange as any}
          className='mt-1 w-full p-2 rounded-md border focus:outline-none'
        >
          <option value=''>关闭</option>
          <option value='1'>1 - 一级隐藏</option>
          <option value='2'>2 - 二级隐藏</option>
          <option value='3'>3 - 三级隐藏</option>
          <option value='4'>4 - 四级隐藏</option>
        </Select>
      </div>
      <Button type='submit' className='w-full  p-2 rounded-md  transition duration-200'>
        保存
      </Button>
    </form>
  );
}
