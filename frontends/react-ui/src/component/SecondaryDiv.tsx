import React from 'react'
import classNames from 'classnames'
export type SecondaryDivProps = React.HTMLProps<HTMLDivElement> & {
  hover?: boolean
}
export function SecondaryDiv(props: SecondaryDivProps) {
  const { className, hover, ...prop } = props
  return (
    <div
      className={classNames(
        className,
        'bg-[var(--alemonjs-secondary-bg)] border-[var(--alemonjs-secondary-border)] text-[var(--alemonjs-secondary-text)]',
        'dark:bg-[var(--alemonjs-dark-secondary-bg)] dark:border-[var(--alemonjs-dark-secondary-border)] dark:text-[var(--alemonjs-dark-secondary-text)]',
        {
          'hover:bg-[var(--alemonjs-secondary-bg-hover)] hover:border-[var(--alemonjs-secondary-border-hover)] hover:text-[var(--alemonjs-secondary-text-hover)]':
            hover
        },
        {
          'dark:hover:bg-[var(--alemonjs-dark-secondary-bg-hover)] dark:hover:border-[var(--alemonjs-dark-secondary-border-hover)] dark:hover:text-[var(--alemonjs-dark-secondary-text-hover)]':
            hover
        }
      )}
      {...prop}
    />
  )
}
