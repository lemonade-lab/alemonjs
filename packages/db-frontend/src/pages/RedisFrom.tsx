import React, { useEffect, useState } from 'react'

export default function RedisFrom() {
  const [formData, setFormData] = useState({
    host: '127.0.0.1',
    port: 6379,
    password: '',
    db: 0
  })

  useEffect(() => {
    if (!window.createDesktopAPI) return
    const API = window.createDesktopAPI()
    window.API = API
    // 获取消息
    API.postMessage({
      type: 'redis.init'
    })
    API.onMessage(data => {
      console.log('收到消息:', data)
      if (data.type === 'redis.init') {
        setFormData({
          host: data.data.host,
          port: data.data.port,
          password: data.data.password,
          db: data.data.db
        })
      }
    })
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('保存的配置:', formData)
    window.API.postMessage({
      type: 'redis.form.save',
      data: formData
    })
  }

  return (
    <form id="redisForm" onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="host" className="block text-sm font-medium text-gray-700">
          Host
        </label>
        <input
          type="text"
          id="host"
          name="host"
          placeholder="127.0.0.1"
          required
          value={formData.host}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="port" className="block text-sm font-medium text-gray-700">
          Port
        </label>
        <input
          type="number"
          id="port"
          name="port"
          placeholder="6379"
          required
          min="1"
          value={formData.port}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          placeholder=""
          value={formData.password}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="db" className="block text-sm font-medium text-gray-700">
          Database
        </label>
        <input
          type="number"
          id="db"
          name="db"
          placeholder="0"
          min="0"
          value={formData.db}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition duration-200"
      >
        保存
      </button>
    </form>
  )
}
