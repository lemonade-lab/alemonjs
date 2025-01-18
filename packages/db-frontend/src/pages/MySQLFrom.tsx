import React, { useEffect, useState } from 'react'
export default function MySQLForm() {
  const [formData, setFormData] = useState({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'alemonjs'
  })

  useEffect(() => {
    if (!window.createDesktopAPI) return
    const API = window.createDesktopAPI()
    window.API = API

    // 获取消息
    API.postMessage({
      type: 'mysql.init'
    })
    API.onMessage(data => {
      console.log('收到消息:', data)
      if (data.type === 'mysql.init') {
        setFormData({
          host: data.data.host,
          port: data.data.port,
          user: data.data.user,
          password: data.data.password,
          database: data.data.database
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
      type: 'mysql.form.save',
      data: formData
    })
  }

  return (
    <form id="mysqlForm" onSubmit={handleSubmit} className="space-y-4">
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
          placeholder="3306"
          required
          min="1"
          value={formData.port}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="user" className="block text-sm font-medium text-gray-700">
          User
        </label>
        <input
          type="text"
          id="user"
          name="user"
          placeholder="用户名"
          required
          value={formData.user}
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
        <label htmlFor="database" className="block text-sm font-medium text-gray-700">
          Database
        </label>
        <input
          type="text"
          id="database"
          name="database"
          placeholder="数据库名"
          required
          value={formData.database}
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
