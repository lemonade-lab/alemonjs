import { Button, Input } from '@alemonjs/react-ui';
import React, { useEffect, useState } from 'react';
export default function MySQLForm() {
  const [formData, setFormData] = useState({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'alemonjs'
  });

  useEffect(() => {
    if (!window.createDesktopAPI) return;
    if (!window.API) {
      window.API = window.createDesktopAPI();
    }
    // 获取消息
    window.API.postMessage({
      type: 'mysql.init'
    });
    window.API.onMessage(data => {
      console.log('收到消息:', data);
      if (data.type === 'mysql.init') {
        setFormData({
          host: data.data.host,
          port: data.data.port,
          user: data.data.user,
          password: data.data.password,
          database: data.data.database
        });
      }
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('保存的配置:', formData);
    window.API.postMessage({
      type: 'mysql.form.save',
      data: formData
    });
  };

  return (
    <form id='mysqlForm' onSubmit={handleSubmit} className='space-y-4'>
      <div>
        <div className='block text-sm font-medium '>Host</div>
        <Input
          type='text'
          id='host'
          name='host'
          placeholder='127.0.0.1'
          required
          value={formData.host}
          onChange={handleChange}
          className='mt-1 block w-full p-2 border  rounded-md focus:outline-none focus:ring '
        />
      </div>
      <div>
        <div className='block text-sm font-medium '>Port</div>
        <Input
          type='number'
          id='port'
          name='port'
          placeholder='3306'
          required
          min='1'
          value={formData.port}
          onChange={handleChange}
          className='mt-1 block w-full p-2 border rounded-md focus:outline-none focus:ring '
        />
      </div>
      <div>
        <div className='block text-sm font-medium '>User</div>
        <Input
          type='text'
          id='user'
          name='user'
          placeholder='用户名'
          required
          value={formData.user}
          onChange={handleChange}
          className='mt-1 block w-full p-2 border rounded-md focus:outline-none focus:ring '
        />
      </div>
      <div>
        <div className='block text-sm font-medium '>Password</div>
        <Input
          type='password'
          id='password'
          name='password'
          placeholder=''
          value={formData.password}
          onChange={handleChange}
          className='mt-1 block w-full p-2 border  rounded-md focus:outline-none focus:ring '
        />
      </div>
      <div>
        <div className='block text-sm font-medium '>Database</div>
        <Input
          type='text'
          id='database'
          name='database'
          placeholder='数据库名'
          required
          value={formData.database}
          onChange={handleChange}
          className='mt-1 block w-full p-2 border rounded-md focus:outline-none focus:ring '
        />
      </div>
      <Button type='submit' className='w-full  p-2 rounded-md  transition duration-200'>
        保存
      </Button>
    </form>
  );
}
