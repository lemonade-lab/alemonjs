import React from 'react'
import classNames from 'classnames'
export interface NotificationDivProps extends React.HTMLProps<HTMLDivElement> {
  type?: 'default' | 'error' | 'warning'
}
export function NotificationDiv(props: NotificationDivProps) {
  const { type, className, ...prop } = props
  return (
    <div
      className={classNames(className, {
        // Default styles
        'bg-[var(--alemonjs-notification-bg)]': type === 'default',
        'text-[var(--alemonjs-notification-text)]': type === 'default',
        'border-[var(--alemonjs-notification-border)]': type === 'default',

        // Error styles
        'bg-[var(--alemonjs-notification-error-bg)]': type === 'error',
        'text-[var(--alemonjs-notification-error-text)]': type === 'error',
        'border-[var(--alemonjs-notification-error-border)]': type === 'error',

        // Warning styles
        'bg-[var(--alemonjs-notification-bg-warning)]': type === 'warning',
        'text-[var(--alemonjs-notification-text-warning)]': type === 'warning',
        'border-[var(--alemonjs-notification-border-warning)]': type === 'warning',

        // Dark mode styles (for all types)
        'dark:bg-[var(--alemonjs-dark-notification-bg)]': type === 'default',
        'dark:text-[var(--alemonjs-dark-notification-text)]': type === 'default',
        'dark:border-[var(--alemonjs-dark-notification-border)]': type === 'default',

        // Dark mode error styles
        'dark:bg-[var(--alemonjs-dark-notification-bg-error)]': type === 'error',
        'dark:text-[var(--alemonjs-dark-notification-text-error)]': type === 'error',
        'dark:border-[var(--alemonjs-dark-notification-border-error)]': type === 'error',

        // Dark mode warning styles
        'dark:bg-[var(--alemonjs-dark-notification-bg-warning)]': type === 'warning',
        'dark:text-[var(--alemonjs-dark-notification-text-warning)]': type === 'warning',
        'dark:border-[var(--alemonjs-dark-notification-border-warning)]': type === 'warning'
      })}
      {...prop}
    />
  )
}
