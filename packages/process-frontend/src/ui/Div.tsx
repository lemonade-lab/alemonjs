import React from 'react'
import classNames from 'classnames'

export function PrimaryDiv(
  props: React.HTMLProps<HTMLDivElement> & {
    hover?: boolean
  }
) {
  const { className, ...prop } = props
  return (
    <div
      className={classNames(
        className,
        'bg-[var(--alemonjs-primary-bg)] border-[var(--alemonjs-primary-border)] text-[var(--alemonjs-primary-text)]',
        {
          'hover:bg-[var(--alemonjs-primary-bg-hover)] hover:border-[var(--alemonjs-primary-border-hover)] hover:text-[var(--alemonjs-primary-text-hover)]':
            props.hover
        },
        'dark:bg-[var(--alemonjs-dark-primary-bg)] dark:border-[var(--alemonjs-dark-primary-border)] dark:text-[var(--alemonjs-dark-primary-text)]',
        {
          'dark:hover:bg-[var(--alemonjs-dark-primary-bg-hover)] dark:hover:border-[var(--alemonjs-dark-primary-border-hover)] dark:hover:text-[var(--alemonjs-dark-primary-text-hover)]':
            props.hover
        }
      )}
      {...prop}
    />
  )
}

export function SecondaryDiv(props: React.HTMLProps<HTMLDivElement> & { hover?: boolean }) {
  const { className, ...prop } = props
  return (
    <div
      className={classNames(
        className,
        'bg-[var(--alemonjs-secondary-bg)] border-[var(--alemonjs-secondary-border)] text-[var(--alemonjs-secondary-text)]',
        'dark:bg-[var(--alemonjs-dark-secondary-bg)] dark:border-[var(--alemonjs-dark-secondary-border)] dark:text-[var(--alemonjs-dark-secondary-text)]',
        {
          'hover:bg-[var(--alemonjs-secondary-bg-hover)] hover:border-[var(--alemonjs-secondary-border-hover)] hover:text-[var(--alemonjs-secondary-text-hover)]':
            props.hover
        },
        {
          'dark:hover:bg-[var(--alemonjs-dark-secondary-bg-hover)] dark:hover:border-[var(--alemonjs-dark-secondary-border-hover)] dark:hover:text-[var(--alemonjs-dark-secondary-text-hover)]':
            props.hover
        }
      )}
      {...prop}
    />
  )
}

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

export function NavDiv(props: React.HTMLProps<HTMLDivElement>) {
  const { className, ...prop } = props
  return (
    <div
      className={classNames(
        className,
        'bg-[var(--alemonjs-nav-bg)] border-[var(--alemonjs-nav-border)] text-[var(--alemonjs-nav-text)]',
        'dark:bg-[var(--alemonjs-dark-nav-bg)] dark:border-[var(--alemonjs-dark-nav-border)] dark:text-[var(--alemonjs-dark-nav-text)]'
      )}
      {...prop}
    />
  )
}

export function BarDiv(props: React.HTMLProps<HTMLDivElement>) {
  const { className, ...prop } = props
  return (
    <div
      className={classNames(
        className,
        'bg-[var(--alemonjs-bar-bg)] border-[var(--alemonjs-bar-border)] text-[var(--alemonjs-bar-text)]',
        'hover:bg-[var(--alemonjs-bar-bg-hover)] hover:border-[var(--alemonjs-bar-border-hover)] hover:text-[var(--alemonjs-bar-text-hover)]',
        'dark:bg-[var(--alemonjs-dark-bar-bg)] dark:border-[var(--alemonjs-dark-bar-border)] dark:text-[var(--alemonjs-dark-bar-text)]',
        'dark:hover:bg-[var(--alemonjs-dark-bar-bg-hover)] dark:hover:border-[var(--alemonjs-dark-bar-border-hover)] dark:hover:text-[var(--alemonjs-dark-bar-text-hover)]'
      )}
      {...prop}
    />
  )
}

export function SidebarDiv(props: React.HTMLProps<HTMLDivElement>) {
  const { className, ...prop } = props
  return (
    <div
      className={classNames(
        className,
        'bg-[var(--alemonjs-sidebar-bg)] border-[var(--alemonjs-sidebar-border)] text-[var(--alemonjs-sidebar-text)]',
        'dark:bg-[var(--alemonjs-dark-sidebar-bg)] dark:border-[var(--alemonjs-dark-sidebar-border)] dark:text-[var(--alemonjs-dark-sidebar-text)]'
      )}
      {...prop}
    />
  )
}

export function TagDiv(props: React.HTMLProps<HTMLDivElement>) {
  const { className, ...prop } = props
  return (
    <div
      className={classNames(
        className,
        'hover:bg-[var(--alemonjs-tag-bg-hover)] hover:border-[var(--alemonjs-tag-border-hover)] hover:text-[var(--alemonjs-tag-text-hover)]',
        'dark:hover:bg-[var(--alemonjs-dark-tag-bg-hover)] dark:hover:border-[var(--alemonjs-dark-tag-border-hover)] dark:hover:text-[var(--alemonjs-dark-tag-text-hover)]'
      )}
      {...prop}
    />
  )
}

interface NotificationProps extends React.HTMLProps<HTMLDivElement> {
  type?: 'default' | 'error' | 'warning'
}

export function NotificationDiv({ type = 'default', className, ...prop }: NotificationProps) {
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
        'bg-[var(--alemonjs-notification-warning-bg)]': type === 'warning',
        'text-[var(--alemonjs-notification-warning-text)]': type === 'warning',
        'border-[var(--alemonjs-notification-warning-border)]': type === 'warning',

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
