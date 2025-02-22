import React from 'react'
import classNames from 'classnames'
export function SidebarDiv(props: React.HTMLProps<HTMLDivElement>) {
  const { className, ...prop } = props
  return (
    <div
      className={classNames(
        className,
        'bg-[var(--alemonjs-sidebar-bg)] border-[var(--alemonjs-sidebar-border)] text-[var(--alemonjs-sidebar-text)]',
        'dark:bg-[var(--alemonjs-dark-sidebar-bg)] dark:border-[var(--alemonjs-dark-sidebar-border)] dark:text-[var(--alemonjs-dark-sidebar-text)]'
      )}
      {...prop}
    />
  )
}
