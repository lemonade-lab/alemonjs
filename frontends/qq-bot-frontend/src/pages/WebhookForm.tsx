import { Button, Input, Select } from '@alemonjs/react-ui';
import React, { useEffect, useState } from 'react';

export default function WebhookForm() {
  const [formData, setFormData] = useState({
    app_id: '',
    token: '',
    secret: '',
    master_key: '',
    route: '/webhook',
    port: 17157,
    sandbox: false,
    markdownToText: false,
    hideUnsupported: ''
  });

  useEffect(() => {
    if (!window.createDesktopAPI) return;
    const API = window.createDesktopAPI();
    window.API = API;

    // 获取消息
    API.postMessage({
      type: 'qq-bot.init'
    });
    API.onMessage(data => {
      if (data.type === 'qq-bot.init') {
        const db = data.data;
        setFormData({
          app_id: db.app_id || '',
          token: db.token || '',
          secret: db.secret || '',
          route: db.route || '/webhook',
          port: db.port || 17157,
          sandbox: db.sandbox || false,
          master_key: Array.isArray(db?.master_key) ? db.master_key.join(',') : '',
          markdownToText: db.markdownToText || false,
          hideUnsupported: db?.hideUnsupported ?? ''
        });
      }
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? e.target.checked : value
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    window.API.postMessage({
      type: 'qq-bot.form.save',
      data: formData
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
        <label className='block text-sm font-medium '>Route</label>
        <Input
          type='text'
          id='route'
          name='route'
          value={formData.route}
          onChange={handleChange}
          className='mt-1 block w-full p-2 border  rounded-md focus:outline-none focus:ring '
        />
      </div>
      <div>
        <label className='block text-sm font-medium '>Port</label>
        <Input
          type='number'
          id='port'
          name='port'
          min='1'
          value={formData.port}
          onChange={handleChange}
          className='mt-1 block w-full p-2 border  rounded-md focus:outline-none focus:ring '
        />
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
