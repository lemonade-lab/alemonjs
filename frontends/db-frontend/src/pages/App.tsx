import { useEffect, useState } from 'react';
import RedisForm from './RedisFrom';
import MySQLForm from './MySQLFrom';
import { Button, PrimaryDiv, SecondaryDiv, Select } from '@alemonjs/react-ui';
export default function App() {
  const [activeTab, setActiveTab] = useState('redis');
  const [dialect, setDialect] = useState('mysql');

  useEffect(() => {
    if (!window.createDesktopAPI) return;
    if (!window.API) {
      window.API = window.createDesktopAPI();
    }
    window.API.postMessage({ type: 'dialect.init' });
    window.API.onMessage(data => {
      if (data.type === 'dialect.init') {
        setDialect(data.data || 'mysql');
      }
    });
  }, []);

  const handleDialectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setDialect(value);
    window.API.postMessage({ type: 'dialect.form.save', data: value });
  };

  return (
    <SecondaryDiv className='flex items-center justify-center p-8'>
      <PrimaryDiv className='rounded-lg shadow-inner w-full p-8'>
        <div className='mb-4'>
          <label className='block text-sm font-medium mb-1'>Dialect</label>
          <Select value={dialect} onChange={handleDialectChange as any} className='w-full p-2 rounded-md border focus:outline-none'>
            <option value='mysql'>mysql</option>
            <option value='sqlite'>sqlite</option>
          </Select>
        </div>
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
