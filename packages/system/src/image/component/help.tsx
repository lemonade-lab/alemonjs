import React from 'react'
import { LinkStyleSheet } from 'jsxp'
import css_output from '@src/asstes/css/input.css'
import helpData from '@src/model/config'
import { getConfig } from 'alemonjs'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

export default function Help() {
  const json = require('../../../package.json')
  const cfg = getConfig()
  const pkg = cfg.package

  return (
    <html>
      <head>
        <LinkStyleSheet src={css_output} />
      </head>
      <body>
        <div className="w-full px-4 pt-5 pb-2 bg-[#f5f6fb]">
          <div className="rounded-lg font-tttgbnumber p-2 relative shadow-md">
            <div className="text-2xl">{pkg.name}/system</div>
            <h2 className="text-xl">使用说明 V {json.version}</h2>
          </div>
          {helpData.map((val, index) => (
            <div key={index} className="rounded-lg mt-5 mb-4 p-5 bg-white shadow-md relative">
              <div className="absolute -top-2 -left-2 bg-[#d4b98c] text-white text-sm px-3 rounded-l-lg z-20">
                {val.group}
              </div>
              <div className="flex justify-start flex-wrap">
                {val.list
                  .reduce((acc, curr, index) => {
                    if (index % 2 === 0) {
                      acc.push([curr]) // 创建新子数组
                    } else {
                      acc[acc.length - 1].push(curr) // 添加到最后一个子数组
                    }
                    return acc
                  }, [])
                  .map((pair, index) => (
                    <div className="flex mb-2 w-full" key={index}>
                      {pair.map(item => (
                        <div
                          className="flex-1 flex items-center bg-[#f1f1f1] p-2 rounded-lg mr-2"
                          key={item.title} // 假设 title 是唯一的
                        >
                          <img className="w-8 h-8" src={item.icon} alt={item.title} />
                          <div className="ml-2">
                            <div className="text-lg">{item.title}</div>
                            <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
              </div>
            </div>
          ))}
          <div className="text-sm font-tttgbnumber text-center text-[#7994a7]">
            Created By {pkg.name} V {pkg.version}
          </div>
        </div>
      </body>
    </html>
  )
}
