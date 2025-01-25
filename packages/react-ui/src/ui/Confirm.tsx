import React, { PropsWithChildren } from 'react'
import { Button } from './Interactive'

type ConfirmProps = {
  onCancel: () => void
  onSuccess: () => void
  footer?: React.ReactNode
  title: string
}

/**
 * @param param0
 * @returns
 */
const Confirm = ({ onCancel, onSuccess, title, children }: PropsWithChildren<ConfirmProps>) => {
  return (
    <div className="px-4 py-2 dark:text-white  flex flex-col gap-4 min-w-36">
      <div className="text-xl ">{title}</div>
      {children}
      <div className="flex gap-4 justify-between">
        <Button onClick={onCancel}>取消</Button>
        <Button onClick={onSuccess}>确认</Button>
      </div>
    </div>
  )
}

//
export default Confirm
