import { useState } from 'react'

export type CollapseItemProps = {
  label: string | React.ReactNode
  children: React.ReactNode
  isOpen: boolean
  onClick: () => void
}

const CollapseItem = ({ label, children, isOpen, onClick }: CollapseItemProps) => (
  <div className="">
    <div onClick={onClick}>{label}</div>
    {isOpen && <div>{children}</div>}
  </div>
)

export type CollapseProps = {
  items: {
    key: string | number
    label: string | React.ReactNode
    children: React.ReactNode
  }[]
}

export const Collapse = ({ items }: CollapseProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const handleClick = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }
  return (
    <div className="flex flex-col ">
      {items.map((item, index) => (
        <CollapseItem
          key={item.key}
          label={item.label}
          isOpen={openIndex === index}
          onClick={() => handleClick(index)}
        >
          {item.children}
        </CollapseItem>
      ))}
    </div>
  )
}
