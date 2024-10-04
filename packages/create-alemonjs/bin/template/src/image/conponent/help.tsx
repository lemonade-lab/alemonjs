import React from 'react'
import { BackgroundImage, createRequire } from 'react-puppeteer'
const require = createRequire(import.meta.url)
type Props = {
  data: string
  theme?: string
}
/**
 * @param param0
 * @returns
 */
export default function App({ data, theme }: Props) {
  return (
    <section id="root" data-theme={theme} className="flex flex-col">
      <BackgroundImage
        className="min-h-[31rem] w-full h-full flex items-end justify-center"
        url={require('../../../public/alemonjs.png')}
        size={'100% auto'}
      >
        <div className="text-blue-400 text-5xl">{data}</div>
      </BackgroundImage>
    </section>
  )
}
