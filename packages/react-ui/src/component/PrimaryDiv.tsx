import React from 'react'
import classNames from 'classnames'

export const classNameBorder =
  'border-[var(--alemonjs-primary-border)] dark:border-[var(--alemonjs-dark-primary-border)]'

export function PrimaryDiv(
  props: React.HTMLProps<HTMLDivElement> & {
    hover?: boolean
  }
) {
  const { className, hover, ...prop } = props
  return (
    <div
      className={classNames(
        className,
        'bg-[var(--alemonjs-primary-bg)] border-[var(--alemonjs-primary-border)] text-[var(--alemonjs-primary-text)]',
        {
          'hover:bg-[var(--alemonjs-primary-bg-hover)] hover:border-[var(--alemonjs-primary-border-hover)] hover:text-[var(--alemonjs-primary-text-hover)]':
            hover
        },
        'dark:bg-[var(--alemonjs-dark-primary-bg)] dark:border-[var(--alemonjs-dark-primary-border)] dark:text-[var(--alemonjs-dark-primary-text)]',
        {
          'dark:hover:bg-[var(--alemonjs-dark-primary-bg-hover)] dark:hover:border-[var(--alemonjs-dark-primary-border-hover)] dark:hover:text-[var(--alemonjs-dark-primary-text-hover)]':
            hover
        }
      )}
      {...prop}
    />
  )
}
