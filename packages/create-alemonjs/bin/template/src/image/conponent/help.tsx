import React from 'react'
import { BackgroundImage, createRequire } from 'react-puppeteer'
const require = createRequire(import.meta.url)
/**
 *
 * @param param0
 * @returns
 */
export default function App({ data }: { data: string }) {
  return (
    <section className="flex flex-col">
      <BackgroundImage
        className="min-h-[36rem] w-full h-full flex items-end justify-center"
        url={require('../../../assets/alemonjs.png')}
        size={'100% auto'}
      >
        <div className="text-blue-400 text-5xl">{data}</div>
      </BackgroundImage>
    </section>
  )
}
