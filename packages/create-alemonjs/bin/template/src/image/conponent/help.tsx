import React from 'react'
import { BackgroundImage } from 'react-puppeteer'
import img_logo from '@public/alemonjs.png'
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
        url={img_logo}
        size={'100% auto'}
      >
        <div className="text-blue-400 text-5xl">{data}</div>
      </BackgroundImage>
    </section>
  )
}
