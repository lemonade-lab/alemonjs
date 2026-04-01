import React from 'react';
import { BackgroundImage } from 'jsxp';
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
        <BackgroundImage className='min-h-[31rem] w-full h-full flex items-end justify-center' url={img_logo} size={'100% auto'}>
          <div className='text-blue-400 text-5xl'>{name}</div>
        </BackgroundImage>
      </section>
    </Html>
  );
}
