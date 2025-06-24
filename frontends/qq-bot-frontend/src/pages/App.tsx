import { useState } from 'react'
import WebhookForm from './WebhookForm'
import WebsoketForm from './WebsoketForm'
import OnlineForm from './OnlineForm'
import { Button, PrimaryDiv, SecondaryDiv } from '@alemonjs/react-ui'
export default function App() {
  const [activeTab, setActiveTab] = useState('websoket')
  return (
    <SecondaryDiv className="flex items-center justify-center p-8">
      <PrimaryDiv className="rounded-lg shadow-inner w-full p-8">
        <div className="flex justify-center mb-4">
          <Button className={`px-4 py-2 rounded-l-lg  }`} onClick={() => setActiveTab('websoket')}>
            Websoket
          </Button>
          <Button className={`px-4 py-2 rounded-y-lg ' }`} onClick={() => setActiveTab('webhhook')}>
            Webhhook
          </Button>
          <Button className={`px-4 py-2 rounded-r-lg ' }`} onClick={() => setActiveTab('online')}>
            WSOnline
          </Button>
        </div>
        {activeTab === 'websoket' && <WebsoketForm />}
        {activeTab === 'webhhook' && <WebhookForm />}
        {activeTab === 'online' && <OnlineForm />}
      </PrimaryDiv>
    </SecondaryDiv>
  )
}
