import { Switch, SwitchGroup, SwitchLabel } from '@headlessui/react'

export function DivSwitch({
  value,
  desc,
  onChange
}: {
  value: boolean
  desc?: string
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex gap-x-4 sm:col-span-2 mt-1.5">
      <SwitchGroup>
        <div className="flex h-6 items-center">
          <Switch
            checked={value}
            onChange={onChange}
            style={{ padding: '2px' }}
            className={[
              value ? 'bg-blue-600' : 'bg-gray-200',
              'flex items-center w-10 cursor-pointer rounded-full ring-1 ring-inset ring-gray-900/5 transition-colors duration-200 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
            ].join(' ')}
          >
            <span
              aria-hidden="true"
              className={[
                value ? 'translate-x-4' : 'translate-x-0',
                'size-5 transform rounded-full bg-white shadow-sm ring-1 ring-gray-900/5 transition duration-200 ease-in-out'
              ].join(' ')}
            />
          </Switch>
          <span className="sr-only">Agree to policies</span>
        </div>
        <SwitchLabel className="text-sm text-gray-600">{desc}</SwitchLabel>
      </SwitchGroup>
    </div>
  )
}
