import React from 'react';
import classNames from 'classnames';

export type InputProps = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;

export function Input(props: InputProps) {
  const { className, ...prop } = props;
  return (
    <input
      type='text'
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
  );
}
