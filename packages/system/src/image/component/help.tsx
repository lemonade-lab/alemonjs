import React from 'react'
import { LinkStyleSheet } from 'jsxp'
import css_output from '@src/asstes/main.css'
import helpData from '@src/model/config'
import { getConfig } from 'alemonjs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
export default function Help() {
  const json = require('../../../package.json')
  const cfg = getConfig()
  const pkg = cfg.package
  console.log('pkg', pkg)
  return (
    <html>
      <head>
        <LinkStyleSheet src={css_output} />
      </head>
      <body>
        <div className="container" id="container">
          <div className="head_box">
            <div className="id_text">{pkg.name}/system</div>
            <h2 className="day_text">使用说明 V {json.version}</h2>
          </div>
          {helpData.map((val, index) => (
            <div key={index} className="data_box">
              <div className="tab_lable">{val.group}</div>
              <div className="list">
                {val.list.map((item, index) => (
                  <div className="item" key={index}>
                    <img className="item-img" src={item.icon} />
                    <div className="title">
                      <div className="text">{item.title}</div>
                      <div className="dec">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="logo">
            Created By {pkg.name} V {pkg.version}
          </div>
        </div>
      </body>
    </html>
  )
}
