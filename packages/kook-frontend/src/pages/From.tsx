import { useEffect, useState } from 'react'

export default function Form() {
  const [formData, setFormData] = useState({
    token: '',
    master_key: ''
  })

  useEffect(() => {
    if (!window.createDesktopAPI) return
    const API = window.createDesktopAPI()
    window.API = API

    // 获取消息
    API.postMessage({
      type: 'kook.init'
    })
    API.onMessage(data => {
      console.log('收到消息:', data)
      if (data.type === 'kook.init') {
        const db = data.data
        // master_key 是数组，转换成字符串
        db.master_key = db.master_key.join(',')
        setFormData(db)
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
      type: 'kook.form.save',
      data: formData
    })
  }

  return (
    <form id="qqBotForm" onSubmit={handleSubmit} className="py-4 space-y-4">
      <div>
        <label htmlFor="app_id" className="block text-sm font-medium text-gray-700">
          Token
        </label>
        <input
          type="number"
          id="token"
          name="token"
          value={formData.token}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="master_key" className="  block text-sm font-medium text-gray-700">
          Master Key
        </label>
        <input
          type="text"
          id="master_key"
          name="master_key"
          value={formData.master_key}
          placeholder="sad12345678,kfp12345678,sgs12345678"
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
