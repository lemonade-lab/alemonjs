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
      <BackgroundImage url={require('../../../assets/App-Store.png')} size={'100% auto'}>
        <div>{data}</div>
      </BackgroundImage>
    </section>
  )
}
