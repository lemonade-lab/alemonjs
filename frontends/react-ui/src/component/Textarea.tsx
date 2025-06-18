import React from 'react'
import classNames from 'classnames'

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export function Textarea(props: TextareaProps) {
  const { className, ...prop } = props
  return (
    <textarea
      className={classNames(
        className,
        'bg-[var(--alemonjs-textarea-bg)] border-[var(--alemonjs-textarea-border)] text-[var(--alemonjs-textarea-text)] placeholder:[var(--alemonjs-textarea-placeholder)]',
        'focus:bg-[var(--alemonjs-textarea-focus-bg)] focus:border-[var(--alemonjs-textarea-focus-border)] focus:text-[var(--alemonjs-textarea-focus-text)]',
        'disabled:bg-[var(--alemonjs-textarea-bg-disabled)] disabled:border-[var(--alemonjs-textarea-border-disabled)] disabled:text-[var(--alemonjs-textarea-text-disabled)]',
        'hover:bg-[var(--alemonjs-textarea-bg-hover)] hover:border-[var(--alemonjs-textarea-border-hover)]',
        'dark:bg-[var(--alemonjs-dark-textarea-bg)] dark:border-[var(--alemonjs-dark-textarea-border)] dark:text-[var(--alemonjs-dark-textarea-text)] dark:placeholder-[var(--alemonjs-dark-textarea-placeholder)]',
        'dark:focus:bg-[var(--alemonjs-dark-textarea-bg-focus)] dark:focus:border-[var(--alemonjs-dark-textarea-border-focus)] dark:focus:text-[var(--alemonjs-dark-textarea-text-focus)]',
        'dark:disabled:bg-[var(--alemonjs-dark-textarea-bg-disabled)] dark:disabled:border-[var(--alemonjs-dark-textarea-border-disabled)] dark:disabled:text-[var(--alemonjs-dark-textarea-text-disabled)]',
        'dark:hover:bg-[var(--alemonjs-dark-textarea-bg-hover)] dark:hover:border-[var(--alemonjs-dark-textarea-border-hover)]'
      )}
      {...prop}
    />
  )
}
