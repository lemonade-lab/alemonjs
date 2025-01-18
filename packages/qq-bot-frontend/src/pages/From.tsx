import React, { useEffect, useState } from 'react'

export default function From() {
  const [formData, setFormData] = useState({
    app_id: '',
    token: '',
    secret: '',
    master_key: '',
    route: '/webhook',
    port: 17157,
    ws: '',
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
          ...db,
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
    <form id="qqBotForm" onSubmit={handleSubmit} className="py-4 space-y-4">
      <div>
        <label htmlFor="app_id" className="block text-sm font-medium text-gray-700">
          App ID
        </label>
        <input
          type="text"
          id="app_id"
          name="app_id"
          value={formData.app_id}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="token" className="block text-sm font-medium text-gray-700">
          Token
        </label>
        <input
          type="text"
          id="token"
          name="token"
          value={formData.token}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="secret" className="block text-sm font-medium text-gray-700">
          Secret
        </label>
        <input
          type="text"
          id="secret"
          name="secret"
          value={formData.secret}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="master_key" className="block text-sm font-medium text-gray-700">
          Master Key
        </label>
        <input
          type="text"
          id="master_key"
          name="master_key"
          value={formData.master_key}
          placeholder="12345,12345,1212121"
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="route" className="block text-sm font-medium text-gray-700">
          Route
        </label>
        <input
          type="text"
          id="route"
          name="route"
          value={formData.route}
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
          min="1"
          value={formData.port}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="ws" className="block text-sm font-medium text-gray-700">
          WebSocket URL
        </label>
        <input
          type="text"
          id="ws"
          name="ws"
          value={formData.ws}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="sandbox" className="inline-flex items-center">
          <input
            type="checkbox"
            id="sandbox"
            name="sandbox"
            checked={formData.sandbox}
            onChange={handleChange}
            className="mr-2"
          />
          Sandbox Mode
        </label>
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
