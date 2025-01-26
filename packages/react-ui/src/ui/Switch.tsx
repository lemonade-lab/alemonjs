import { useEffect, useState } from 'react'
import classNames from 'classnames'

interface ToggleSwitchProps {
  value: boolean
  onChange?: (checked: boolean) => void
  hover?: boolean
  disabled?: boolean
}

export const Switch = ({ value, onChange, hover = false, disabled = false }: ToggleSwitchProps) => {
  const [checked, setChecked] = useState(value)

  useEffect(() => {
    setChecked(value)
  }, [value])

  const handleToggle = () => {
    if (disabled) return
    const newChecked = !checked
    setChecked(newChecked)
    if (onChange) {
      onChange(newChecked)
    }
  }

  return (
    <div className="relative inline-flex items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={handleToggle}
        className="sr-only"
        disabled={disabled}
      />
      <div
        className={classNames(
          'w-12 h-6 rounded-full flex items-center cursor-pointer transition-all duration-300 border',
          {
            // 正常模式（未选中/选中）
            'bg-[var(--alemonjs-switch-bg)] border-[var(--alemonjs-switch-border)]': !checked,
            'bg-[var(--alemonjs-switch-bg-checked)] border-[var(--alemonjs-switch-border-checked)]':
              checked,

            // Hover 状态
            'hover:bg-[var(--alemonjs-switch-bg-hover)] hover:border-[var(--alemonjs-switch-border-hover)]':
              hover && !checked,
            'hover:bg-[var(--alemonjs-switch-bg-checked-hover)] hover:border-[var(--alemonjs-switch-border-checked-hover)]':
              hover && checked,

            // Disabled 状态
            'bg-[var(--alemonjs-switch-bg-disabled)] border-[var(--alemonjs-switch-border-disabled)] cursor-not-allowed':
              disabled,
            'hover:bg-[var(--alemonjs-switch-bg-disabled-hover)] hover:border-[var(--alemonjs-switch-border-disabled-hover)]':
              disabled && hover,

            // 深色模式
            'dark:bg-[var(--alemonjs-dark-switch-bg)] dark:border-[var(--alemonjs-dark-switch-border)]':
              !checked,
            'dark:bg-[var(--alemonjs-dark-switch-bg-checked)] dark:border-[var(--alemonjs-dark-switch-border-checked)]':
              checked,

            // 深色模式 Hover
            'dark:hover:bg-[var(--alemonjs-dark-switch-bg-hover)] dark:hover:border-[var(--alemonjs-dark-switch-border-hover)]':
              hover && !checked,
            'dark:hover:bg-[var(--alemonjs-dark-switch-bg-checked-hover)] dark:hover:border-[var(--alemonjs-dark-switch-border-checked-hover)]':
              hover && checked,

            // 深色模式 Disabled
            'dark:bg-[var(--alemonjs-dark-switch-bg-disabled)] dark:border-[var(--alemonjs-dark-switch-border-disabled)] dark:cursor-not-allowed':
              disabled,
            'dark:hover:bg-[var(--alemonjs-dark-switch-bg-disabled-hover)] dark:hover:border-[var(--alemonjs-dark-switch-border-disabled-hover)]':
              disabled && hover
          }
        )}
        onClick={handleToggle}
      >
        <div
          className={classNames(
            'w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-300',
            {
              'translate-x-7': checked,
              'translate-x-1': !checked
            }
          )}
        />
      </div>
    </div>
  )
}
