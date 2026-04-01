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

    const head = Head(null, Title('欢迎使用 ALemonJS！'), Style(style));

    const body = Body(
      null,
      H1('ALemonJS 启动成功！'),
      P(null, '已成功通过 ', A({ href: 'https://alemonjs.com', target: '_blank' }, 'ALemonJS 框架'), ' 启动。'),
      Div({ className: 'footer' }, '— 感谢选择 ALemonJS。')
    );

    return Html(null, head, body);
  }
}

export default App.renderToHtml();
