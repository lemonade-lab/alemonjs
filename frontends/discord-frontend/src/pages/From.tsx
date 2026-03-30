import { Button, Input, Select } from '@alemonjs/react-ui';
import React, { useEffect, useState } from 'react';

export default function Form() {
  const [formData, setFormData] = useState({
    token: '',
    master_key: '',
    master_id: '',
    websocket_proxy: '',
    request_proxy: '',
    hideUnsupported: ''
  });

  useEffect(() => {
    if (!window.createDesktopAPI) return;
    const API = window.createDesktopAPI();
    window.API = API;

    // 获取消息
    API.postMessage({
      type: 'discord.init'
    });
    API.onMessage(data => {
      if (data.type === 'discord.init') {
        const db = data.data;
        setFormData({
          token: db?.token ?? '',
          master_key: Array.isArray(db?.master_key) ? db.master_key.join(',') : '',
          master_id: Array.isArray(db?.master_id) ? db.master_id.join(',') : '',
          websocket_proxy: db?.websocket_proxy ?? '',
          request_proxy: db?.request_proxy ?? '',
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
      type: 'discord.form.save',
      data: formData
    });
  };

  return (
    <form onSubmit={handleSubmit} className='py-4 space-y-4'>
      <div>
        <label htmlFor='token' className='block text-sm font-medium text-gray-700'>
          Token
        </label>
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
        <label htmlFor='master_key' className='block text-sm font-medium text-gray-700'>
          Master Key
        </label>
        <Input
          type='text'
          id='master_key'
          name='master_key'
          value={formData.master_key}
          placeholder='sad12345678,kfp12345678,sgs12345678'
          onChange={handleChange}
          className='mt-1 block w-full p-2 border  rounded-md focus:outline-none focus:ring '
        />
      </div>
      <div>
        <label htmlFor='master_id' className='block text-sm font-medium text-gray-700'>
          Master ID
        </label>
        <Input
          type='text'
          id='master_id'
          name='master_id'
          value={formData.master_id}
          placeholder='id1,id2,id3'
          onChange={handleChange}
          className='mt-1 block w-full p-2 border  rounded-md focus:outline-none focus:ring '
        />
      </div>
      <div>
        <label htmlFor='websocket_proxy' className='block text-sm font-medium text-gray-700'>
          WebSocket Proxy
        </label>
        <Input
          type='text'
          id='websocket_proxy'
          name='websocket_proxy'
          value={formData.websocket_proxy}
          placeholder='http://localhost:7890'
          onChange={handleChange}
          className='mt-1 block w-full p-2 border  rounded-md focus:outline-none focus:ring '
        />
      </div>
      <div>
        <label htmlFor='request_proxy' className='block text-sm font-medium text-gray-700'>
          Request Proxy
        </label>
        <Input
          type='text'
          id='request_proxy'
          name='request_proxy'
          value={formData.request_proxy}
          placeholder='http://localhost:7890'
          onChange={handleChange}
          className='mt-1 block w-full p-2 border  rounded-md focus:outline-none focus:ring '
        />
      </div>
      <div>
        <label htmlFor='hideUnsupported' className='block text-sm font-medium text-gray-700'>
          Hide Unsupported
        </label>
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
