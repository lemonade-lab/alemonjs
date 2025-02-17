import { useEffect, useState } from 'react'
import RedisForm from './RedisFrom' // 确保文件名正确
import MySQLForm from './MySQLFrom'
import { PrimaryDiv, SecondaryDiv } from '@alemonjs/react-ui'
import Docker from './Docker'

export default function App() {
  const [activeTab, setActiveTab] = useState('docker')

  useEffect(() => {
    if (!window.createDesktopAPI) return
    const API = window.createDesktopAPI()
    window.API = API
  }, [])

  return (
    <SecondaryDiv className="flex items-center justify-center p-8">
      <PrimaryDiv className="rounded-lg shadow-inner w-full p-8">
        <div className="flex justify-center mb-4">
          <button
            className={`px-4 py-2 rounded-l-lg ${
              activeTab === 'docker' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
            onClick={() => setActiveTab('docker')}
          >
            Docker
          </button>
          <button
            className={`px-4 py-2  ${
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
        {activeTab === 'docker' && <Docker />}
        {activeTab === 'redis' && <RedisForm />}
        {activeTab === 'mysql' && <MySQLForm />}
      </PrimaryDiv>
    </SecondaryDiv>
  )
}
