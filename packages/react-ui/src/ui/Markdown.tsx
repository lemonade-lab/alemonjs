import MarkdownPreview from '@uiw/react-markdown-preview'
import rehypeHighlight from 'rehype-highlight'
// import rehypePrism from 'rehype-prism'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeRaw from 'rehype-raw'
import rehypeAttr from 'rehype-attr'
import { useEffect } from 'react'

/**
 * @param param0
 * @returns
 */
export const Markdown = ({ source }: { source: string }) => {
  // theme
  useEffect(() => {
    // 监听主题变化
    const observer = new MutationObserver(mutationsList => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const hasDarkClass = document.documentElement.classList.contains('dark')
          document.documentElement.setAttribute('data-color-mode', hasDarkClass ? 'dark' : 'light')
        }
      }
    })
    // 监听根元素的 class 变化
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    return () => {
      // 移除监听
      observer.disconnect()
    }
  }, [])
  return (
    <MarkdownPreview
      className="animate__animated animate__fadeIn select-text"
      style={{
        padding: '0.5rem',
        backgroundColor: '#FFFFFF00'
      }}
      source={source}
      components={{
        a: ({ node, ...props }) => (
          <span
            {...props}
            onClick={e => e.preventDefault()}
            title="链接已禁用"
            style={{ cursor: 'not-allowed' }}
          >
            {props.children}
          </span>
        )
      }}
      rehypePlugins={[
        // rehypeSanitize, // 清理不安全的 HTML
        rehypeHighlight, // 代码高亮
        // rehypePrism, // Prism.js 高亮
        rehypeSlug, // 为标题生成锚点
        rehypeRaw, // 允许处理原始 HTML
        [rehypeAutolinkHeadings, { behavior: 'wrap' }], // 自动为标题添加链接
        [
          rehypeAttr,
          {
            // 示例：为所有链接添加 target="_blank"
            properties: {
              target: '_blank',
              rel: 'noopener noreferrer'
            }
          }
        ]
      ]}
    />
  )
}
