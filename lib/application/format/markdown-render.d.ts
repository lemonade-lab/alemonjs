import { DataMarkDown, DataMarkdownBlockquote } from "../../types/message/markdown.js";
//#region src/application/format/markdown-render.d.ts
/**
 * 将完整引用块渲染为 Markdown（也可作为纯文本降级）。
 * 子节点由平台递归渲染，保留平台自己的链接、mention 和样式规则。
 * 两侧空行隔离相邻段落；内部空行也必须带引用标记。
 */
declare const renderMarkdownBlockquote: (value: DataMarkdownBlockquote['value'], renderChildren: (items: DataMarkDown['value']) => string) => string;
/** 块级节点负责隔离相邻正文；行内节点保持直接拼接。 */
declare const joinMarkdownParts: (items: readonly {
  type: string;
}[], parts: readonly string[]) => string;
/** 无原生 Markdown 渲染器的平台使用的可读文本降级，递归保留引用内容。 */
declare const markdownToPlainText: (items: DataMarkDown['value'], hideUnsupported?: boolean | number) => string;
//#endregion
export { joinMarkdownParts, markdownToPlainText, renderMarkdownBlockquote };