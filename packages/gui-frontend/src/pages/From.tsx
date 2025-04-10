import { Button, Input } from '@alemonjs/react-ui'
import React, { useEffect, useState } from 'react'

export default function Form() {
  const [formData, setFormData] = useState({
    port: '',
    master_key: ''
  })

  useEffect(() => {
    if (!window.createDesktopAPI) return
    const API = window.createDesktopAPI()
    window.API = API

    // 获取消息
    API.postMessage({
      type: 'gui.init'
    })
    API.onMessage(data => {
      if (data.type === 'gui.init') {
        const db = data.data
        setFormData({
          port: db.port ?? 17127,
          master_key: typeof db?.master_key == 'string' ? db?.master_key : ''
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
    console.log('保存的配置:', formData)
    window.API.postMessage({
      type: 'gui.form.save',
      data: formData
    })
  }

  return (
    <form onSubmit={handleSubmit} className="py-4 space-y-4">
      <div>
        <label htmlFor="app_id" className="block text-sm font-medium text-gray-700">
          Port
        </label>
        <Input
          type="number"
          id="port"
          name="port"
          value={formData.port}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border  rounded-md focus:outline-none focus:ring "
        />
      </div>
      <div>
        <label htmlFor="master_key" className="  block text-sm font-medium text-gray-700">
          Master Key
        </label>
        <Input
          type="text"
          id="master_key"
          name="master_key"
          value={formData.master_key}
          placeholder="sad12345678,kfp12345678,sgs12345678"
          onChange={handleChange}
          className="mt-1 block w-full p-2 border  rounded-md focus:outline-none focus:ring "
        />
      </div>
      <Button type="submit" className="w-full  p-2 rounded-md  transition duration-200">
        保存
      </Button>
    </form>
  )
}
