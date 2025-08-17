export const html = `
  <!DOCTYPE html>
<html>
<head>
    <title>欢迎使用 AlemonJS！</title>
    <style>
        body {
            width: 35em;
            margin: 0 auto;
            font-family: Tahoma, Verdana, Arial, sans-serif;
            background-color: #f8f8f8;
            color: #333;
        }
        h1 {
            color: #0099cc;
            margin-top: 2em;
        }
        .footer {
            margin-top: 3em;
            font-size: 0.9em;
            color: #888;
        }
        a {
            color: #0099cc;
        }
    </style>
</head>
<body>
    <h1>AlemonJS 启动成功！</h1>
    <p>
        恭喜，您的服务已成功通过 <a href="https://alemonjs.com" target="_blank">AlemonJS 框架</a> 启动。
    </p>
    <p>
        如果想访问主应用，请访问， <a href="/app" target="_blank">/app</a>（对应根目录index.html）
    </p>
    <p>
        如果想访问其他应用，请访问 /apps/[package-name]</a>。(对应/packages/[package-name]/index.html)
    </p>
    <div class="footer">
        <p>感谢选择 AlemonJS。</p>
    </div>
</body>
</html>

  `
