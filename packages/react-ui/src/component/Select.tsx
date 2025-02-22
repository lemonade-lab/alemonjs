import React from 'react'
import classNames from 'classnames'
export type SelectProps = React.HTMLProps<HTMLSelectElement>
export function Select(props: SelectProps) {
  const { className, ...prop } = props
  return (
    <select
      className={classNames(
        className,
        'bg-[var(--alemonjs-select-bg)] border-[var(--alemonjs-select-border)] text-[var(--alemonjs-select-text)]',
        'focus:bg-[var(--alemonjs-select-bg-focus)] focus:border-[var(--alemonjs-select-border-focus)]',
        'disabled:bg-[var(--alemonjs-select-bg-disabled)] disabled:border-[var(--alemonjs-select-border-disabled)]',
        'hover:bg-[var(--alemonjs-select-bg-hover)] hover:border-[var(--alemonjs-select-border-hover)]',
        'dark:bg-[var(--alemonjs-dark-select-bg)] dark:border-[var(--alemonjs-dark-select-border)] dark:text-[var(--alemonjs-dark-select-text)]',
        'dark:focus:bg-[var(--alemonjs-dark-select-bg-focus)] dark:focus:border-[var(--alemonjs-dark-select-border-focus)]',
        'dark:disabled:bg-[var(--alemonjs-dark-select-bg-disabled)] dark:disabled:border-[var(--alemonjs-dark-select-border-disabled)]',
        'dark:hover:bg-[var(--alemonjs-dark-select-bg-hover)] dark:hover:border-[var(--alemonjs-dark-select-border-hover)]'
      )}
      {...prop}
    />
  )
}
