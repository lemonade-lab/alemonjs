import React from 'react'
import classNames from 'classnames'
export function Button(
  props: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>
) {
  const { className, ...prop } = props
  return (
    <button
      type="button"
      className={classNames(
        className,
        'bg-[var(--alemonjs-button-bg)] border-[var(--alemonjs-button-border)] text-[var(--alemonjs-button-text)]',
        'hover:bg-[var(--alemonjs-button-bg-hover)] hover:border-[var(--alemonjs-button-border-hover)] hover:text-[var(--alemonjs-button-text-hover)]',
        'focus:outline-none focus:ring-2 focus:ring-[var(--alemonjs-button-bg)]',
        'dark:bg-[var(--alemonjs-dark-button-bg)] dark:border-[var(--alemonjs-dark-button-border)] dark:text-[var(--alemonjs-dark-button-text)]',
        'dark:hover:bg-[var(--alemonjs-dark-button-bg-hover)] dark:hover:border-[var(--alemonjs-dark-button-border-hover)] dark:hover:text-[var(--alemonjs-dark-button-text-hover)]'
      )}
      {...prop}
    />
  )
}
