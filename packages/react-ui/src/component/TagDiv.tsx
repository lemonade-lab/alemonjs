import React from 'react'
import classNames from 'classnames'
export function TagDiv(props: React.HTMLProps<HTMLDivElement>) {
  const { className, ...prop } = props
  return (
    <div
      className={classNames(
        className,
        'hover:bg-[var(--alemonjs-tag-bg-hover)] hover:border-[var(--alemonjs-tag-border-hover)] hover:text-[var(--alemonjs-tag-text-hover)]',
        'dark:hover:bg-[var(--alemonjs-dark-tag-bg-hover)] dark:hover:border-[var(--alemonjs-dark-tag-border-hover)] dark:hover:text-[var(--alemonjs-dark-tag-text-hover)]'
      )}
      {...prop}
    />
  )
}
