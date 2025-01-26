import { useState } from 'react'
export function RadioGroup({
  name,
  value,
  options,
  onChange
}: {
  name: string
  value: number
  options: string[]
  onChange?: Function
}) {
  const [valueIndex, setValueIndex] = useState(value)
  return (
    <div className="flex flex-col">
      {options.map((opt, index) => (
        <label className="inline-flex items-center" key={opt}>
          <input
            type="radio"
            name={name}
            checked={valueIndex == index}
            onChange={() => (setValueIndex(index), onChange && onChange(index))}
            className="mr-2"
          />
          {opt}
        </label>
      ))}
    </div>
  )
}
