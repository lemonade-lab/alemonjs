import React from 'react';
import classNames from 'classnames';

export type NavDivProps = React.HTMLProps<HTMLDivElement>;

export function NavDiv(props: NavDivProps) {
  const { className, ...prop } = props;
  return (
    <div
      className={classNames(
        className,
        'bg-[var(--alemonjs-nav-bg)] border-[var(--alemonjs-nav-border)] text-[var(--alemonjs-nav-text)]',
        'dark:bg-[var(--alemonjs-dark-nav-bg)] dark:border-[var(--alemonjs-dark-nav-border)] dark:text-[var(--alemonjs-dark-nav-text)]'
      )}
      {...prop}
    />
  );
}
