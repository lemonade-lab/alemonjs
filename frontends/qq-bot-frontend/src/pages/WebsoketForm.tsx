import { Button, Input, Select } from '@alemonjs/react-ui'
import React, { useEffect, useState } from 'react'

export default function WebsoketForm() {
  const [formData, setFormData] = useState({
    app_id: '',
    token: '',
    secret: '',
    master_key: '',
    mode: 'group',
    sandbox: false
  })

  useEffect(() => {
    if (!window.createDesktopAPI) return
    const API = window.createDesktopAPI()
    window.API = API

    // 获取消息
    API.postMessage({
      type: 'qq-bot.init'
    })
    API.onMessage(data => {
      if (data.type === 'qq-bot.init') {
        const db = data.data
        setFormData({
          app_id: db.app_id || '',
          token: db.token || '',
          secret: db.secret || '',
          mode: db.mode || 'group',
          sandbox: db.sandbox || false,
          master_key: Array.isArray(db?.master_key) ? db.master_key.join(',') : ''
        })
      }
    })
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? e.target.checked : value
    })
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    window.API.postMessage({
      type: 'qq-bot.form.save',
      data: formData
    })
  }

  return (
    <form onSubmit={handleSubmit} className="py-4 space-y-4">
      <div>
        <label className="block text-sm font-medium ">App ID</label>
        <Input
          type="text"
          id="app_id"
          name="app_id"
          value={formData.app_id}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border  rounded-md focus:outline-none focus:ring "
        />
      </div>
      <div>
        <label className="block text-sm font-medium ">Token</label>
        <Input
          type="text"
          id="token"
          name="token"
          value={formData.token}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border  rounded-md focus:outline-none focus:ring "
        />
      </div>
      <div>
        <label className="block text-sm font-medium ">Secret</label>
        <Input
          type="text"
          id="secret"
          name="secret"
          value={formData.secret}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border  rounded-md focus:outline-none focus:ring "
        />
      </div>
      <div>
        <label className="block text-sm font-medium ">Master Key</label>
        <Input
          type="text"
          id="master_key"
          name="master_key"
          value={formData.master_key}
          placeholder="123456,456789,345678"
          onChange={handleChange}
          className="mt-1 block w-full p-2 border  rounded-md focus:outline-none focus:ring "
        />
      </div>
      <div>
        <label className="block text-sm font-medium ">Mode</label>
        <Select
          value={formData.mode}
          id="mode"
          name="mode"
          onChange={handleChange as any}
          className="w-full p-2 rounded-md border focus:outline-none"
        >
          <option value="group">group</option>
          <option value="guild">guild</option>
          <option value="all">all</option>
        </Select>
      </div>
      <div>
        <label className="inline-flex items-center">
          <Input
            type="checkbox"
            id="sandbox"
            name="sandbox"
            checked={formData.sandbox}
            onChange={handleChange}
            className="mr-2"
          />
          Sandbox
        </label>
      </div>
      <Button type="submit" className="w-full  p-2 rounded-md  transition duration-200">
        保存
      </Button>
    </form>
  )
}
