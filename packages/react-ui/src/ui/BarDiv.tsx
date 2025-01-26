import React from 'react'
import classNames from 'classnames'

export function BarDiv(props: React.HTMLProps<HTMLDivElement>) {
  const { className, ...prop } = props
  return (
    <div
      className={classNames(
        className,
        'bg-[var(--alemonjs-bar-bg)] border-[var(--alemonjs-bar-border)] text-[var(--alemonjs-bar-text)]',
        'hover:bg-[var(--alemonjs-bar-bg-hover)] hover:border-[var(--alemonjs-bar-border-hover)] hover:text-[var(--alemonjs-bar-text-hover)]',
        'dark:bg-[var(--alemonjs-dark-bar-bg)] dark:border-[var(--alemonjs-dark-bar-border)] dark:text-[var(--alemonjs-dark-bar-text)]',
        'dark:hover:bg-[var(--alemonjs-dark-bar-bg-hover)] dark:hover:border-[var(--alemonjs-dark-bar-border-hover)] dark:hover:text-[var(--alemonjs-dark-bar-text-hover)]'
      )}
      {...prop}
    />
  )
}
