export default `<script> 
          const expansionsName = <@name>
          // 创建桌面API 
          window.createDesktopAPI = ()=> window.appDesktopAPI.create(expansionsName)

          // 创建隐藏桌面API
          const main =  window.appDesktopHideAPI?.create(expansionsName)

          // 监听隐藏消息
          main.on(data => {
             if(data.type == 'css-variables') {
              const cssVariables = data.data
                  try {
        Object.keys(cssVariables).forEach(key => {
          document.documentElement.style.setProperty(\`--$\{key\}\`, cssVariables[key])
        })
      } catch (e) {
        console.error(e)
      }

             }else if (data.type == 'theme-mode') {
              const mode = data.data
                if (mode === 'dark') {
                    document.documentElement.classList.add('dark')
                } else {
                    document.documentElement.classList.remove('dark')
                }
             }
          })

          // 获取 css 变量

          main.send({
            type: 'css-variables'
          })

          // 获得 css 主题

          main.send({
            type: 'theme-mode'
          })


</script>`
