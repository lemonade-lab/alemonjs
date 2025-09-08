import { useState } from 'react';
import RedisForm from './RedisFrom';
import MySQLForm from './MySQLFrom';
import { Button, PrimaryDiv, SecondaryDiv } from '@alemonjs/react-ui';
export default function App() {
  const [activeTab, setActiveTab] = useState('redis');
  return (
    <SecondaryDiv className='flex items-center justify-center p-8'>
      <PrimaryDiv className='rounded-lg shadow-inner w-full p-8'>
        <div className='flex justify-center mb-4'>
          <Button className={`px-4 py-2 rounded-l-lg  }`} onClick={() => setActiveTab('redis')}>
            Redis
          </Button>
          <Button className={`px-4 py-2 rounded-r-lg ' }`} onClick={() => setActiveTab('mysql')}>
            MySQL
          </Button>
        </div>
        {activeTab === 'redis' && <RedisForm />}
        {activeTab === 'mysql' && <MySQLForm />}
      </PrimaryDiv>
    </SecondaryDiv>
  );
}
