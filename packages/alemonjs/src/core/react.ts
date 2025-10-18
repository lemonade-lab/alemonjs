type Props = Record<string, any>;
type VNode =
  | string
  | number
  | null
  | boolean
  | {
      type: string | any;
      props: Props;
      children: any[];
    };

export const DOCTYPE = '<!DOCTYPE html>';

const escapeHtml = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export function createElement(type: string | any, props?: Props | null, ...children: any[]): VNode {
  props = props || {};
  // 扁平化 children，过滤掉 false, null, undefined
  const flatChildren = children.flat(Infinity).filter(c => c !== false && c !== null && c !== undefined);

  return {
    type,
    props,
    children: flatChildren
  } as any;
}

export class Component<P = object, S = object> {
  props: P;
  state: S;
  constructor(props: P) {
    this.props = props;
    this.state = {} as S;
  }
  setState(partial: Partial<S>) {
    // 这里只是合并状态（静态渲染库，不会触发 DOM 更新）
    this.state = Object.assign({}, this.state, partial);
  }
  render(): VNode {
    return '' as any;
  }

  // 修复：使用 this（子类）来创建实例，而不是固定的 Component
  static renderToString(this: any) {
    return renderToString(createElement(this, null));
  }

  static renderToHtml(this: any) {
    return DOCTYPE + this.renderToString();
  }
}

/** 将 props 转为 HTML 属性字符串（className -> class） */
function attrsToString(props: Props = {}): string {
  const parts: string[] = [];

  for (const key of Object.keys(props)) {
    if (key === 'children') {
      continue;
    }
    const val = props[key];

    if (val === false || val === undefined || val === null) {
      continue;
    }
    if (key === 'className') {
      parts.push(`class="${escapeHtml(String(val))}"`);
      continue;
    }
    if (key === 'style' && typeof val === 'object') {
      const styleStr = Object.entries(val)
        .map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${v}`)
        .join(';');

      parts.push(`style="${escapeHtml(styleStr)}"`);
      continue;
    }
    if (val === true) {
      parts.push(`${key}`);
      continue;
    }
    parts.push(`${key}="${escapeHtml(String(val))}"`);
  }

  return parts.length ? ' ' + parts.join(' ') : '';
}

const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

/** 渲染 VNode 为字符串 */
export function renderToString(vnode: any): string {
  if (vnode === null || vnode === undefined || vnode === false) {
    return '';
  }
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return escapeHtml(String(vnode));
  }
  // 处理直接的片段对象（{ props, children }）
  if (typeof vnode === 'object' && vnode.type === undefined) {
    return (vnode.children ?? []).map(renderToString).join('');
  }

  // 函数组件或类组件
  if (typeof vnode.type === 'function') {
    const Comp = vnode.type;

    if (Comp.prototype && typeof Comp.prototype.render === 'function') {
      const inst = new Comp(Object.assign({}, vnode.props, { children: vnode.children }));
      const rendered = inst.render();

      return renderToString(rendered);
    } else {
      const rendered = Comp(Object.assign({}, vnode.props, { children: vnode.children }));

      return renderToString(rendered);
    }
  }

  // 普通 HTML 元素
  const tag = String(vnode.type);
  const props = vnode.props ?? {};

  // 支持 dangerouslySetInnerHTML
  if (props?.dangerouslySetInnerHTML && typeof props.dangerouslySetInnerHTML === 'object' && props.dangerouslySetInnerHTML.__html !== null) {
    const attrs = attrsToString(props);
    const inner = String(props.dangerouslySetInnerHTML.__html);

    return `<${tag}${attrs}>${inner}</${tag}>`;
  }

  const attrs = attrsToString(props);

  if (voidTags.has(tag.toLowerCase())) {
    return `<${tag}${attrs} />`;
  }
  const children = (vnode.children ?? []).map(renderToString).join('');

  return `<${tag}${attrs}>${children}</${tag}>`;
}

function makeTag(tag: string) {
  return function tagFactory(first?: any, ...restChildren: any[]) {
    const looksLikeProps = first !== null && typeof first === 'object' && !Array.isArray(first) && Object.prototype.toString.call(first) === '[object Object]';

    if (looksLikeProps) {
      return createElement(tag, first as Props, ...restChildren);
    } else {
      const children: any[] = [];

      if (first !== undefined && first !== null) {
        children.push(first);
      }
      children.push(...restChildren);

      return createElement(tag, null, ...children);
    }
  };
}

export const Html = makeTag('html');
export const Head = makeTag('head');
export const Body = makeTag('body');
export const Title = makeTag('title');
export const Style = makeTag('style');
export const H1 = makeTag('h1');
export const P = makeTag('p');
export const A = makeTag('a');
export const Div = makeTag('div');
