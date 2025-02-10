import React, { useEffect, useState, useRef } from 'react'
import { Select2 } from '@/components/select'
import { Modal } from '@/components/modal'
import { Password } from '@/components/password'
import { DivButton } from '@/components/button'
import { DivSwitch } from '@/components/switch'
import { RadioGroup } from '@/components/radios'
import { ExclamationTriangleIcon, RocketLaunchIcon } from '@heroicons/react/24/outline'
import FileProcess from '@/utils/file'

export default function From() {
  const logLevel = ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'mark', 'off']
  const platForm = ['1.安卓手机', '2.aPad', '3.安卓手表', '4.MacOS', '5.iPad', '6.Tim']

  // QQconfig
  const [formData, setFormData] = useState({
    qq: '',
    password: '',
    device: '2',
    sign_api_addr: '',
    ver: '9.0.90',
    master_key: '',
    log_level: 'info',
    ignore_self: true,
    resend: true,
    reconn_interval: 5,
    cache_group_member: true,
    ffmpeg_path: '',
    ffprobe_path: ''
  })

  const defaultModel: {
    open: boolean
    type: string
    title: string
    desc: string
    img: string
    url: string
    value: string | number
    options: string[]
    confirm_text: string
  } = {
    open: false,
    type: 'text',
    title: '',
    desc: '',
    img: '',
    url: '',
    value: 0,
    options: [''],
    confirm_text: '确认'
  }
  const [modal, setModal] = useState(defaultModel)
  const [botOnline, setBotline] = useState(false)
  const [botRunning, setBotRunning] = useState(false)

  const frameRef = useRef(null)
  const buttonRef = useRef(null)

  // 表单更改
  const handleChange = (e: any) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  // 提交配置
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // console.log(formData)
    window.API.postMessage({
      type: 'qq.form.save',
      data: formData
    })
  }

  // 模态窗确认事件
  const modalConfirm = useRef((modal: typeof defaultModel) => {
    setModal({ ...defaultModel, open: false })
  })

  // 登录
  const handleLoginQQ = (
    e: React.FormEvent<HTMLButtonElement>,
    wait: {
      enable: boolean
      cd: number
    }
  ) => {
    if (botRunning) {
      window.API.postMessage({
        type: 'qq.offline',
        data: true
      })
      wait.enable && (buttonRef.current as any).clearInterval()
    } else {
      window.API.postMessage({
        type: 'qq.login',
        data: formData
      })
    }
  }

  // 删除icqq_dir
  const handleDeleteIcqq = () => {
    // 预检请求
    window.API.postMessage({
      type: 'qq.files.list.icqq',
      data: formData.qq ?? ''
    })
  }

  // 上传文件
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log(event.target.files)
    // 读取每个文件的内容到Buffer中
    if (event.target.files) {
      try {
        const fileBase64s = await FileProcess.upload(event.target.files)
        // console.log('All files processed.', fileBase64s);
        window.API.postMessage({
          type: 'qq.files.upload',
          data: fileBase64s
        })
      } catch (err: any) {
        setModal({
          ...defaultModel,
          title: '上传失败！',
          type: 'text',
          desc: err.stack ?? err.message,
          confirm_text: '',
          open: true
        })
      }
    }
  }

  window.addEventListener('message', event => {
    console.log(event.origin, event.data)
    if (event.data?.ticket) {
      setModal({
        ...defaultModel,
        title: '捕获到ticket，正在尝试登录...',
        type: 'text',
        desc: event.data.ticket,
        confirm_text: '',
        open: true
      })
      window.API.postMessage({
        type: 'qq.login.ticket',
        data: event.data.ticket
      })
    } else {
      // console.warn('Message from unexpected origin:', event.origin);
      // 可以选择忽略或处理来自不受信任源的消息
    }
  })

  useEffect(() => {
    if (!window.createDesktopAPI) return
    const API = window.createDesktopAPI()
    window.API = API

    // 获取消息
    API.postMessage({
      type: 'qq.init',
      data: ''
    })

    API.onMessage(data => {
      const db = data?.data

      switch (data.type) {
        // 显示配置
        case 'qq.init': {
          setFormData({
            ...db,
            master_key: Array.isArray(db?.master_key) ? db.master_key.join(',') : ''
          })
          break
        }
        // 监听是否在线
        case 'qq.online': {
          setBotline(db)
          break
        }
        // 监听运行
        case 'qq.running': {
          setBotRunning(db)
          break
        }
        // 显示二维码
        case 'qq.login.qrcode': {
          ;(buttonRef.current as any).clearInterval()
          setModal({
            ...defaultModel,
            title: '请用该账号设备扫码',
            type: 'qrcode',
            img: `data:image/png;base64,${db}`,
            confirm_text: '扫码后确认',
            open: true
          })
          modalConfirm.current = () => {
            API.postMessage({
              type: 'qq.login.qrcode.scaned',
              data: ''
            })
          }
          break
        }
        // 二维码刷新过多
        case 'qq.login.qrcode.expired': {
          setModal({
            ...defaultModel,
            title: db,
            type: 'text',
            desc: '',
            confirm_text: '',
            open: true
          })
          break
        }
        // 图形验证码捕获ticket
        case 'qq.login.slider': {
          ;(buttonRef.current as any).clearInterval()
          setModal({
            ...defaultModel,
            title: '请完成图形自动验证：',
            type: 'iframe',
            url: db,
            confirm_text: '尝试手动验证',
            open: true
          })
          modalConfirm.current = () => {
            setModal({
              ...defaultModel,
              title: '手动获取ticket',
              type: 'text,input',
              desc: `请用验证App\n[https://wwp.lanzouy.com/i6w3J08um92h][3kuu]\n或网页控制台手动抓取ticket：\n${new URLSearchParams(
                new URL(db).search
              ).get('url')}\n并填写到输入框确认：`,
              value: '',
              confirm_text: '确认',
              open: true
            })
            modalConfirm.current = m => {
              setModal({
                ...defaultModel,
                title: `正在提交ticket验证，请稍等...`,
                confirm_text: '',
                open: true
              })
              window.API.postMessage({
                type: 'qq.login.ticket',
                data: m.value
              })
            }
          }
          break
        }
        // 设备锁验证，扫码验证和短信验证码
        case 'qq.device.validate': {
          ;(buttonRef.current as any).clearInterval()
          setModal({
            ...defaultModel,
            type: 'radios',
            title: db.msg,
            value: 1,
            options: db.choices,
            open: true
          })
          modalConfirm.current = m => {
            if (m.value == 0) {
              // 扫码
              setModal({
                ...defaultModel,
                title: '请完成验证：',
                type: 'iframe',
                url: db.url,
                confirm_text: '确定',
                open: true
              })
              modalConfirm.current = () => {
                setModal({
                  ...defaultModel,
                  title: `正尝试登录，请稍等...`,
                  confirm_text: '',
                  open: true
                })
                API.postMessage({
                  type: 'qq.device.validate.choice',
                  data: {
                    choice: m.value,
                    url: db.url,
                    phone: db.phone
                  }
                })
              }
              return
            }
            // 短信
            API.postMessage({
              type: 'qq.device.validate.choice',
              data: {
                choice: m.value,
                url: db.url,
                phone: db.phone
              }
            })
          }
          break
        }
        // 发送短信
        case 'qq.smscode.send': {
          ;(buttonRef.current as any).clearInterval()
          setModal({
            ...defaultModel,
            title: `已向 ${db} 发送验证码，请填写：`,
            type: 'input',
            value: '',
            confirm_text: '确认',
            open: true
          })
          modalConfirm.current = m => {
            setModal({
              ...defaultModel,
              title: `提交验证码[${m.value}]，请稍等...`,
              confirm_text: ''
            })
            API.postMessage({
              type: 'qq.smscode',
              data: m.value
            })
          }
          break
        }
        // 收到并提交验证码
        case 'qq.smscode.received': {
          ;(buttonRef.current as any).clearInterval()
          setModal({
            ...defaultModel,
            title: `正尝试验证登录，请稍等...`,
            type: 'text',
            desc: '',
            confirm_text: '',
            open: true
          })
          break
        }
        // 系统上线
        case 'qq.system.online': {
          setModal({
            ...defaultModel,
            title: `登录成功！`,
            type: 'text',
            desc: db,
            confirm_text: '',
            open: true
          })
          setBotline(true)
          break
        }
        // 系统下线
        case 'qq.system.offline': {
          setModal({
            ...defaultModel,
            title: `@AlemonJS/QQ 下线！`,
            type: 'text',
            desc: db,
            confirm_text: '退出进程',
            open: true
          })
          modalConfirm.current = () => {
            setBotRunning(false)
            setModal({
              ...defaultModel,
              title: `已推出进程！`,
              type: 'text',
              desc: db,
              confirm_text: '',
              open: true
            })
            window.API.postMessage({
              type: 'qq.process.exit',
              data: ''
            })
          }
          break
        }
        // 文件上传成功
        case 'qq.files.upload.success': {
          setModal({
            ...defaultModel,
            title: '上传成功！',
            type: 'text',
            desc: db,
            confirm_text: '',
            open: true
          })
          break
        }
        // 文件删除或下载
        case 'qq.files.delete.list': {
          setModal({
            ...defaultModel,
            title: '您确定要删除以下文件吗?',
            type: 'text,radios',
            desc: (db as Array<{ name: string; data: string; size: number }>)
              ?.map((item, index) => `${index + 1}: ${item.name} --${item.size}B`)
              .join('\n'),
            value: 0,
            options: ['是的，我要删除', '不，我要下载'],
            confirm_text: '确定',
            open: true
          })
          modalConfirm.current = m => {
            if (m.value == 0) {
              window.API.postMessage({
                type: 'qq.files.delete.icqq',
                data: formData.qq
              })
              setModal(defaultModel)
            } else if (m.value == 1) {
              try {
                FileProcess.download(db)
                setModal(defaultModel)
              } catch (err: any) {
                setModal({
                  ...defaultModel,
                  title: '错误',
                  type: 'text',
                  desc: err.stack ?? err.message,
                  confirm_text: '',
                  open: true
                })
              }
            }
          }
          break
        }
        // 监听错误
        case 'qq.error': {
          ;(buttonRef.current as any).clearInterval()
          setModal({
            ...defaultModel,
            title: '错误',
            type: 'text',
            desc: db,
            confirm_text: '退出进程',
            open: true
          })
          modalConfirm.current = () => {
            setBotRunning(false)
            setModal({
              ...defaultModel,
              title: `@AlemonJS/QQ 下线！`,
              type: 'text',
              confirm_text: '',
              desc: db,
              open: true
            })
            window.API.postMessage({
              type: 'qq.process.exit',
              data: ''
            })
          }
          break
        }
      }
    })

    return () => {
      API.postMessage({
        type: 'qq.desktop.unmount',
        data: ''
      })
    }
  }, [])

  return (
    <>
      <Modal
        title={modal.title}
        visible={modal.open}
        conformText={modal.confirm_text}
        onConfirm={() => modalConfirm.current(modal)}
        onClose={() => {
          setModal({ ...modal, open: false })
        }}
        icon={<ExclamationTriangleIcon aria-hidden="true" className="size-6 text-blue-600" />}
      >
        {/qrcode/.test(modal.type) && <img className="w-full" src={modal.img} />}
        {/text/.test(modal.type) && (
          <pre className="mr-6 whitespace-pre-wrap break-words text-wrap">{modal.desc}</pre>
        )}
        {/html/.test(modal.type) && (
          <pre className="mr-6 whitespace-pre-wrap break-words text-wrap">
            <span dangerouslySetInnerHTML={{ __html: modal.desc }} />
          </pre>
        )}
        {/iframe/.test(modal.type) && (
          <iframe ref={frameRef} className="w-96 h-96" src={modal.url} />
        )}
        {/radios/.test(modal.type) && (
          <RadioGroup
            name="dev"
            value={modal.value as number}
            options={modal.options}
            onChange={(e: number) => setModal({ ...modal, value: e })}
          />
        )}
        {/input/.test(modal.type) && (
          <input
            type="text"
            name="sms"
            value={modal.value as string}
            onChange={e => setModal({ ...modal, value: e.target.value })}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
          />
        )}
      </Modal>

      <form id="qqForm" onSubmit={handleSubmit} className="py-4 space-y-4">
        <div>
          <label htmlFor="qq" className="block text-sm font-semibold text-gray-700">
            QQ
          </label>
          <input
            type="text"
            id="qq"
            name="qq"
            value={formData.qq}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
            密码
          </label>
          <Password
            name="password"
            placeholder="不填则使用扫码登录"
            value={formData.password}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="device" className="block text-sm font-semibold text-gray-700">
            登录设备
          </label>
          <Select2
            name="device"
            value={platForm[Number(formData.device) - 1]}
            options={platForm}
            onChange={e =>
              handleChange({
                target: {
                  name: 'device',
                  value: String(platForm.findIndex(item => e.target.value == item) + 1)
                }
              })
            }
          />
        </div>

        <div>
          <label htmlFor="master_key" className="block text-sm font-semibold text-gray-700">
            Master Key
          </label>
          <input
            type="text"
            id="master_key"
            name="master_key"
            value={formData.master_key}
            placeholder="12345,12345,1212121"
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="sign_api_addr" className="block text-sm font-semibold text-gray-700">
            签名地址
          </label>
          <input
            type="text"
            id="sign_api_addr"
            name="sign_api_addr"
            value={formData.sign_api_addr}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="ver" className="block text-sm font-semibold text-gray-700">
            签名版本
          </label>
          <input
            type="text"
            id="ver"
            name="ver"
            value={formData.ver}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="log_level" className="block text-sm font-semibold text-gray-700">
            日志等级
          </label>
          <Select2
            name="log_level"
            desc="越靠前越详细"
            value={formData.log_level}
            options={logLevel}
            onChange={e => handleChange({ target: { name: 'log_level', value: e.target.value } })}
          />
        </div>

        <div>
          <label htmlFor="ignore_self" className="block text-sm font-semibold text-gray-700">
            群聊和频道中是否过滤自己的消息
          </label>
          <DivSwitch
            value={formData.ignore_self}
            onChange={e => {
              const event = {
                target: {
                  name: 'ignore_self',
                  value: e,
                  type: 'switch'
                }
              }
              handleChange(event)
            }}
          />
        </div>
        <div>
          <label htmlFor="resend" className="block text-sm font-semibold text-gray-700">
            被风控时是否尝试用分片发送
          </label>
          <DivSwitch
            value={formData.resend}
            onChange={e => {
              const event = {
                target: {
                  name: 'resend',
                  value: e,
                  type: 'switch'
                }
              }
              handleChange(event)
            }}
          />
        </div>
        <div>
          <label htmlFor="reconn_interval" className="block text-sm font-semibold text-gray-700">
            掉线后的重新登录间隔秒数
          </label>
          <input
            type="number"
            id="reconn_interval"
            min={0}
            placeholder="为0则不重连"
            name="reconn_interval"
            value={formData.reconn_interval}
            onChange={e =>
              handleChange({ target: { name: 'reconn_interval', value: Number(e.target.value) } })
            }
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="ffmpeg_path" className="block text-sm font-semibold text-gray-700">
            ffmepg路径
          </label>
          <input
            type="text"
            id="ffmpeg_path"
            name="ffmpeg_path"
            placeholder="绝对路径"
            value={formData.ffmpeg_path}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="ffprobe_path" className="block text-sm font-semibold text-gray-700">
            ffprobe路径
          </label>
          <input
            type="text"
            id="ffprobe_path"
            placeholder="绝对路径"
            name="ffprobe_path"
            value={formData.ffprobe_path}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="port" className="block text-sm font-semibold text-gray-700">
            上传Device和token
          </label>
          <div className="mt-1 relative flex justify-center items-center w-full border border-gray-300 rounded-md has-[input:focus-within]:outline-none has-[input:focus-within]:ring has-[input:focus-within]:ring-blue-500">
            <input
              type="file"
              multiple
              onChange={handleUpload}
              className="w-full p-1 border border-gray-300 opacity-0"
            />
            <span className="absolute text-gray-400 -z-10">如果已有，则会覆盖</span>
          </div>
        </div>

        <DivButton
          cd={10}
          ref={buttonRef}
          style={botOnline ? { backgroundColor: 'red' } : {}}
          onClick={handleLoginQQ}
          onChildren={(open, cd) => (
            <>
              {open ? (
                <span className="animate-pulse">尝试启动中 {cd} </span>
              ) : botRunning ? (
                `${botOnline ? '已在线' : '运行中'}，点击停止`
              ) : (
                '登录'
              )}
              {open && <RocketLaunchIcon className="text-white animate-spin size-6 ml-2" />}
            </>
          )}
        ></DivButton>

        <div className="flex justify-between items-center">
          <button
            type="submit"
            className="w-full mr-1 bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition duration-200"
          >
            保存配置
          </button>

          <button
            type="button"
            className="w-full ml-1 bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition duration-200"
            onClick={handleDeleteIcqq}
          >
            删除device和token
          </button>
        </div>
      </form>
    </>
  )
}
