import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { ChevronUpDownIcon } from '@heroicons/react/16/solid'
import { CheckIcon } from '@heroicons/react/20/solid'
import { Select as ASelect } from '@alemonjs/react-ui'
export function Select({
  name,
  value,
  options,
  onChange,
  desc
}: {
  name: string
  desc?: string
  value: string
  options: string[]
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
}) {
  return (
    <div className="mt-2.5">
      <div className="flex rounded-md bg-white outline outline-1 -outline-offset-1 outline-gray-300 has-[input:focus-within]:outline has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-indigo-600">
        <input
          className="block min-w-0 grow py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6"
          placeholder={desc}
          disabled
        ></input>
        <div className="ml-auto grid shrink-0 grid-cols-1 focus-within:relative w-fit">
          <ASelect
            name={name}
            value={value}
            onChange={onChange}
            className="col-start-1 row-start-1 w-fit appearance-none rounded-md py-2 pl-3.5 pr-7 text-base text-gray-500 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          >
            {options.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </ASelect>
        </div>
      </div>
    </div>
  )
}

export function SelectAndDesc({
  name,
  value,
  options,
  onChange
}: {
  name: string
  desc?: string
  value: string
  options: string[]
  onChange: (e: any) => void
}) {
  // const [selected, setSelected] = useState(value)

  const handleClick = (opt: string) => {
    onChange({ target: { name: name, value: opt } })
  }

  return (
    <div className="relative mt-1">
      <Listbox value={value} onChange={handleClick}>
        <ListboxButton className="grid w-full cursor-default grid-cols-1 bg-white py-1.5 pr-2 pl-3 text-left text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500 sm:text-sm/6">
          <span className="col-start-1 row-start-1 flex items-center gap-3 p-px pr-6">
            <span className="block truncate text-base">{value}</span>
          </span>
          <ChevronUpDownIcon
            aria-hidden="true"
            className="col-start-1 row-start-1 size-6 self-center justify-self-end text-gray-500 sm:size-4"
          />
        </ListboxButton>

        <ListboxOptions
          transition
          className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base ring-1 shadow-lg ring-black/5 focus:outline-hidden data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0 sm:text-sm"
        >
          {options.map(opt => (
            <ListboxOption
              key={opt}
              value={opt}
              className="group relative cursor-default py-2 pr-9 pl-3 text-gray-900 select-none hover:bg-indigo-600 hover:text-white hover:outline-hidden"
            >
              <div className="flex items-center">
                <span className="ml-3 block truncate font-medium group-data-selected:font-semibold">
                  {opt}
                </span>
              </div>

              {opt == value && (
                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600 group-not-data-selected:hidden group-data-focus:text-white">
                  <CheckIcon aria-hidden="true" className="size-5" />
                </span>
              )}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </Listbox>
    </div>
  )
}
