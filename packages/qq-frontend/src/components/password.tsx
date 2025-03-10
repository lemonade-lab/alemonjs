import { useState } from 'react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { Input } from '@alemonjs/react-ui'
export function Password({
  name,
  placeholder,
  value,
  onChange
}: {
  name?: string
  placeholder?: string
  value: string
  onChange?: React.ChangeEventHandler<HTMLInputElement>
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div
      className={`mt-1 flex items-center rounded-md w-full border border-gray-300 has-[input:focus-within]:outline-none has-[input:focus-within]:ring has-[input:focus-within]:ring-blue-500`}
    >
      <Input
        id={name}
        name={name}
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="ml-1 block w-full p-2 pl-1"
      />
      <div className="shrink-0 select-none text-base text-gray-500 sm:text-sm/6 mr-2 ml-2">
        {visible ? (
          <EyeIcon className="size-5" onClick={() => setVisible(false)} />
        ) : (
          <EyeSlashIcon className="size-5" onClick={() => setVisible(true)} />
        )}
      </div>
    </div>
  )
}
