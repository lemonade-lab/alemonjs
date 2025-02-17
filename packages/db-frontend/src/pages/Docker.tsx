import { useEffect } from 'react'
import { Markdown } from '@alemonjs/react-ui'

export default function Docker() {
  useEffect(() => {
    if (!window.createDesktopAPI) return
  }, [])

  const source = `
\`\`\`yml
# 密码： Mm002580!
# 用户： root
# 端口： 3306
services:
  mysql:
    image: mysql:8.0
    container_name: mysql-container
    environment:
      MYSQL_ROOT_PASSWORD: 'Mm002580!'
      MYSQL_ROOT_HOST: '%'
      MYSQL_ALLOW_EMPTY_PASSWORD: 'yes'
    ports:
      - '3306:3306'
    command: --default-authentication-plugin=mysql_native_password
    volumes:
      - ./init.sql:/docker-entrypoint-initdb.d/docker-dbinit.sql

  redis:
    image: redis:6.2-alpine
    container_name: redis-container
    ports:
      - '6379:6379'
\`\`\``

  const source2 = `
\`\`\`sql
-- 数据库名称：alemonjs
CREATE DATABASE IF NOT EXISTS \`alemonjs\`
CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci;
\`\`\`
`

  const source3 = `

## 启动

\`\`\`sh
docker-compose up -d
\`\`\`

## 查看状态

\`\`\`sh
docker-compose ps
\`\`\`

## 停止

\`\`\`sh
docker-compose down
\`\`\`

`

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg ">
      <p className="text-red-500 mb-4">
        若 Docker 未安装，请
        <a
          className="text-blue-500 underline"
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.docker.com/"
        >
          点击前往
        </a>
        下载
      </p>
      <h1 className="text-2xl font-bold mb-4">Docker配置参考</h1>
      <h2 className="text-xl font-semibold mb-2 flex gap-2">
        <div>docker-compose.yml</div>
        <div
          className="text-sm text-gray-500"
          onClick={() => {
            // 使用a标签
            const a = document.createElement('a')
            a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(source)
            a.download = 'docker-compose.yml'
            a.click()
          }}
        >
          下载
        </div>
      </h2>
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <Markdown source={source} />
      </div>
      <h2 className="text-xl font-semibold mb-2 flex gap-2">
        <div>docker-dbinit.sql</div>
        <div
          className="text-sm text-gray-500"
          onClick={() => {
            // 使用a标签
            const a = document.createElement('a')
            a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(source)
            a.download = 'docker-dbinit.sql'
            a.click()
          }}
        >
          下载
        </div>
      </h2>
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <Markdown source={source2} />
      </div>
      <h2 className="text-xl font-semibold mb-2">控制指令</h2>
      <div>下载 docker-compose.yml 和 docker-dbinit.sql 文件，放置在同一目录下，执行以下命令：</div>
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <Markdown source={source3} />
      </div>
    </div>
  )
}
