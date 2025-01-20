import React, { useEffect, useState } from 'react'
import classNames from 'classnames'

interface ToggleSwitchProps {
  value: boolean
  onChange?: (checked: boolean) => void
}

const Switch: React.FC<ToggleSwitchProps> = ({ value, onChange }) => {
  const [checked, setChecked] = useState(value)

  const handleToggle = () => {
    const newChecked = !checked
    setChecked(newChecked)
    if (onChange) {
      onChange(newChecked)
    }
  }

  useEffect(() => {
    setChecked(value)
  }, [value])

  return (
    <div className="relative inline-flex items-center ">
      <input type="checkbox" checked={checked} onChange={handleToggle} className="sr-only" />
      <div
        className={classNames(
          'w-12 h-6 rounded-full flex items-center cursor-pointer transition-all duration-300',
          {
            'bg-blue-500': checked,
            'bg-gray-300': !checked
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

export default Switch
