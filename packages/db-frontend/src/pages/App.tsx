import { useState } from 'react'
import RedisForm from './RedisFrom' // 确保文件名正确
import MySQLForm from './MySQLFrom'

export default function App() {
  const [activeTab, setActiveTab] = useState('redis')
  return (
    <div className="flex items-center justify-center p-8">
      <div className="bg-white  rounded-lg p-8 shadow-inner w-full max-w-md">
        <div className="flex justify-center mb-4">
          <button
            className={`px-4 py-2 rounded-l-lg ${
              activeTab === 'redis' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
            onClick={() => setActiveTab('redis')}
          >
            Redis
          </button>
          <button
            className={`px-4 py-2 rounded-r-lg ${
              activeTab === 'mysql' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
            onClick={() => setActiveTab('mysql')}
          >
            MySQL
          </button>
        </div>
        {activeTab === 'redis' && <RedisForm />}
        {activeTab === 'mysql' && <MySQLForm />}
      </div>
    </div>
  )
}
