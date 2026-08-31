import { Button, Input } from '@alemonjs/react-ui';
import React, { useEffect, useState } from 'react';

export default function Form() {
  const [formData, setFormData] = useState({
    name: '',
    qrcode_url: '',
    master_key: ''
  });

  useEffect(() => {
    if (!window.createDesktopAPI) return;
    const API = window.createDesktopAPI();
    window.API = API;

    // 获取消息
    API.postMessage({
      type: 'wechat.init'
    });
    API.onMessage(data => {
      if (data.type === 'wechat.init') {
        const db = data.data;
        setFormData({
          name: db?.name ?? '',
          qrcode_url: db?.qrcode_url ?? '',
          master_key: Array.isArray(db?.master_key) ? db.master_key.join(',') : ''
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
      type: 'wechat.form.save',
      data: formData
    });
  };

  return (
    <form onSubmit={handleSubmit} className='py-4 space-y-4'>
      <div>
        <label htmlFor='name' className='block text-sm font-medium text-gray-700'>
          Wechaty 实例名
        </label>
        <Input
          type='text'
          id='name'
          name='name'
          value={formData.name}
          placeholder='alemonjs'
          onChange={handleChange}
          className='mt-1 block w-full p-2 border  rounded-md focus:outline-none focus:ring '
        />
      </div>
      <div>
        <label htmlFor='qrcode_url' className='block text-sm font-medium text-gray-700'>
          二维码链接前缀
        </label>
        <Input
          type='text'
          id='qrcode_url'
          name='qrcode_url'
          value={formData.qrcode_url}
          placeholder='https://wechaty.js.org/qrcode/'
          onChange={handleChange}
          className='mt-1 block w-full p-2 border  rounded-md focus:outline-none focus:ring '
        />
      </div>
      <div>
        <label htmlFor='master_key' className='block text-sm font-medium text-gray-700'>
          管理员 Key
        </label>
        <Input
          type='text'
          id='master_key'
          name='master_key'
          value={formData.master_key}
          placeholder='多个 Key 使用英文逗号分隔'
          onChange={handleChange}
          className='mt-1 block w-full p-2 border  rounded-md focus:outline-none focus:ring '
        />
      </div>
      <Button type='submit' className='w-full  p-2 rounded-md  transition duration-200'>
        保存
      </Button>
    </form>
  );
}
