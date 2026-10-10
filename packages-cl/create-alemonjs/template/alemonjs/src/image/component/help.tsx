import React from 'react';
import img_logo from '@src/assets/alemonjs.png';
import Html from './Html';

/**
 * @param param0
 * @returns
 */
export default function App({ name }: { name: string }) {
  return (
    <Html>
      <section id='root' className='flex flex-col'>
        <div className=' min-h-124 w-full h-full flex items-end justify-center'
          style={{ backgroundImage: `url(${img_logo})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className='text-blue-400 text-5xl'>{name}</div>
        </div>
      </section>
    </Html>
  );
}
