import { A, Body, Component, Div, H1, Head, Html, P, Style, Title } from '../../core/react';

class App extends Component {
  render() {
    const style = `
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
      a { color: #0099cc; }
    `;

    const head = Head(null, Title('欢迎使用 AlemonJS！'), Style(style));

    const body = Body(
      null,
      H1('AlemonJS 启动成功！'),
      P(null, '已成功通过 ', A({ href: 'https://alemonjs.com', target: '_blank' }, 'AlemonJS 框架'), ' 启动。'),
      P(null, '如果想访问主应用，请访问， ', A({ href: '/app', target: '_blank' }, '/app'), '（对应根目录index.html）'),
      P(
        null,
        '如果想访问其他应用，请访问 ',
        A({ href: '/apps/[package-name]', target: '_blank' }, '/apps/[package-name]'),
        '。(对应/packages/[package-name]/index.html)'
      ),
      Div({ className: 'footer' }, '— 感谢选择 AlemonJS。')
    );

    return Html(null, head, body);
  }
}

export default App.renderToHtml();
