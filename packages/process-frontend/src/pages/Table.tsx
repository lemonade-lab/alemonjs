import { useEffect, useState } from 'react'
import { Switch } from '@alemonjs/react-ui'

export default function Table() {
  const [expansions, setExpansions] = useState<{
    package: {
      name: string
      version?: string
      description?: string
      author?:
        | string
        | {
            name: string
            email: string
            url: string
          }
      // 开关
      _alemonjs_apps_switch: boolean
    }[]
  }>({
    package: []
  })

  useEffect(() => {
    if (!window.createDesktopAPI) return
    const desktopAPI = window.createDesktopAPI()
    window.desktopAPI = desktopAPI
    // 获取扩展列表
    window.desktopAPI.expansion.getList()
    // 监听扩展列表
    window.desktopAPI.expansion.on(data => {
      try {
        if (data.type == 'get-expansions') {
          const value = data.data
          if (Array.isArray(value) && value && value.length > 0) {
            const value$1 = value.filter((item: any) => {
              if (!item?.alemonjs) return true
              if (!item?.alemonjs?.desktop) return true
              if (!item?.alemonjs?.desktop?.platform) return true
              if (!Array.isArray(item?.alemonjs?.desktop?.platform)) return true
              return false
            })
            setExpansions({
              package: value$1
            })
          }
        }
        window.desktopAPI.postMessage({
          type: 'process.get.apps'
        })
      } catch {
        console.error('HomeApp 解析消息失败')
      }
    })
    window.desktopAPI.onMessage(data => {
      // console.log('Form.tsx message', message)
      if (data.type == 'process.get.apps') {
        const { data: apps } = data
        setExpansions(expansions => {
          return {
            ...expansions,
            package: expansions.package.map(item => {
              if (apps.includes(item.name)) {
                return {
                  ...item,
                  _alemonjs_apps_switch: true
                }
              }
              return {
                ...item,
                _alemonjs_apps_switch: false
              }
            })
          }
        })
      }
    })
  }, [])

  return (
    <table className="min-w-full">
      <thead>
        <tr className="">
          <th className="py-3 px-4 text-left ">名称</th>
          <th className="py-3 px-4 text-left">描述</th>
          <th className="py-3 px-4 text-left">版本</th>
          <th className="py-3 px-4 text-left">作者</th>
          <th className="py-3 px-4 text-left">操作</th>
        </tr>
      </thead>
      <tbody>
        {expansions.package.map(item => (
          <tr key={item.name} className="">
            <td className="py-3 px-4 ">{item?.name}</td>
            <td className="py-3 px-4 ">{item?.description}</td>
            <td className="py-3 px-4 ">{item?.version}</td>
            <td className="py-3 px-4 ">
              {typeof item.author === 'string' ? item.author : item?.author?.name}
            </td>
            <td className="py-3 px-4 ">
              {typeof item._alemonjs_apps_switch === 'boolean' && (
                <Switch
                  value={item._alemonjs_apps_switch}
                  onChange={value => {
                    if (value) {
                      window.desktopAPI.postMessage({
                        type: 'process.open.apps',
                        data: item.name
                      })
                      return
                    }
                    window.desktopAPI.postMessage({
                      type: 'process.disable.apps',
                      data: item.name
                    })
                  }}
                />
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
