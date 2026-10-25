/** QQ Markdown 专用扩展。仅生成字符串，不扩展 alemonjs 的通用节点或渲染协议。 */
export type QQMarkdownMathOptions = {
  block?: boolean;
};

export type QQMarkdownTask = {
  text: string;
  checked?: boolean;
};

const latexText = (text: string): string => {
  const escapes: Record<string, string> = {
    '\\': '\\textbackslash{}',
    '{': '\\{',
    '}': '\\}',
    $: '\\$',
    '&': '\\&',
    '#': '\\#',
    '%': '\\%',
    _: '\\_',
    '^': '\\textasciicircum{}',
    '~': '\\textasciitilde{}'
  };

  return `\\text{${text.replace(/[\\{}$&#%_^~]/g, character => escapes[character]).replace(/\r\n?|\n/g, ' ')}}`;
};

const math = (latex: string, options?: QQMarkdownMathOptions): string => (options?.block ? `\n\n$$\n${latex}\n$$\n\n` : `$${latex}$`);

/**
 * 仅用于支持这些扩展的 QQ Markdown 消息；通过 addContent() 或原始 Markdown 发送。
 * 不提供跨平台渲染或自动降级，调用方应根据发送平台选择内容。
 */
export const QQMarkdown = {
  math,
  taskList(...items: QQMarkdownTask[]): string {
    if (items.length === 0) {
      return '';
    }

    return '\n\n' + items.map(item => `- [${item.checked ? 'x' : ' '}] ${item.text.replace(/\r\n?|\n/g, ' ')}`).join('\n') + '\n\n';
  },
  underline(text: string): string {
    return math(`\\underline{${latexText(text)}}`);
  },
  color(text: string, color: string): string {
    if (!/^(?:[a-zA-Z]+|#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?)$/.test(color)) {
      throw new TypeError('QQ Markdown color must be a color name or #RGB / #RRGGBB');
    }

    return math(`\\color{${color}}{${latexText(text)}}`);
  },
  ruby(text: string, annotation: string): string {
    return math(`\\overset{${latexText(annotation)}}{${latexText(text)}}`);
  },
  boxed(text: string): string {
    return math(`\\boxed{${latexText(text)}}`);
  },
  cancel(text: string): string {
    return math(`\\cancel{${latexText(text)}}`);
  }
};
