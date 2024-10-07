import React, { type CSSProperties } from 'react'

/**
 * div扩展组件类型
 */
type DivBackgroundImageProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> & {
  /**
   * The background-image CSS 属性在元素上设置一个或多个背景图像。
   */
  url: string | string[]
  /**
   * The background-size CSS 属性设置元素背景图像的大小。图像可以保留其自然大小、拉伸或约束以适合可用空间。
   */
  size?: CSSProperties['backgroundSize']
}

export const BackgroundImage = ({
  children,
  style = {},
  size = '100% auto',
  url,
  ...props
}: DivBackgroundImageProps) => {
  return (
    <div
      style={{
        backgroundImage: Array.isArray(url)
          ? url.map(item => `url(${item})`).join(',')
          : `url(${url})`,
        backgroundSize: size,
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  )
}
