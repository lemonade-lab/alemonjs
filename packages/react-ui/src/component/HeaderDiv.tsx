import React from 'react'
import classNames from 'classnames'

export function HeaderDiv(props: React.HTMLProps<HTMLDivElement>) {
  const { className, ...prop } = props
  return (
    <div
      className={classNames(
        className,
        'bg-[var(--alemonjs-header-bg)] border-[var(--alemonjs-header-border)] text-[var(--alemonjs-header-text)]',
        'dark:bg-[var(--alemonjs-dark-header-bg)] dark:border-[var(--alemonjs-dark-header-border)] dark:text-[var(--alemonjs-dark-header-text)]'
      )}
      {...prop}
    />
  )
}
