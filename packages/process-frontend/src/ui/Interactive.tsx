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

export function Input(
  props: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>
) {
  const { className, ...prop } = props
  return (
    <input
      type="text"
      className={classNames(
        className,
        'bg-[var(--alemonjs-input-bg)] border-[var(--alemonjs-input-border)] text-[var(--alemonjs-input-text)] placeholder:[var(--alemonjs-input-placeholder)]',
        'focus:bg-[var(--alemonjs-input-bg-focus)] focus:border-[var(--alemonjs-input-border-focus)] focus:text-[var(--alemonjs-input-text-focus)]',
        'disabled:bg-[var(--alemonjs-input-bg-disabled)] disabled:border-[var(--alemonjs-input-border-disabled)] disabled:text-[var(--alemonjs-input-text-disabled)]',
        'hover:bg-[var(--alemonjs-input-bg-hover)] hover:border-[var(--alemonjs-input-border-hover)]',
        'dark:bg-[var(--alemonjs-dark-input-bg)] dark:border-[var(--alemonjs-dark-input-border)] dark:text-[var(--alemonjs-dark-input-text)] dark:placeholder-[var(--alemonjs-dark-input-placeholder)]',
        'dark:focus:bg-[var(--alemonjs-dark-input-bg-focus)] dark:focus:border-[var(--alemonjs-dark-input-border-focus)] dark:focus:text-[var(--alemonjs-dark-input-text-focus)]',
        'dark:disabled:bg-[var(--alemonjs-dark-input-bg-disabled)] dark:disabled:border-[var(--alemonjs-dark-input-border-disabled)] dark:disabled:text-[var(--alemonjs-dark-input-text-disabled)]',
        'dark:hover:bg-[var(--alemonjs-dark-input-bg-hover)] dark:hover:border-[var(--alemonjs-dark-input-border-hover)]'
      )}
      {...prop}
    />
  )
}

export function Select(
  props: React.DetailedHTMLProps<React.SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>
) {
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

export function Textarea(
  props: React.DetailedHTMLProps<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    HTMLTextAreaElement
  >
) {
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
