import { TagDiv } from './TagDiv'
import classNames from 'classnames'
import { useState } from 'react'

export type TabsProps = {
  items: {
    key: string
    label: string | React.ReactNode
    children: React.ReactNode
  }[]
}

export const Tabs = ({ items }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(items[0].key)
  return (
    <div>
      <div
        className={classNames(
          'border-b flex border-[var(--alemonjs-primary-border)] dark:border-[var(--alemonjs-dark-primary-border)'
        )}
      >
        {items.map(item => (
          <TagDiv
            key={item.key}
            className={classNames(`px-2 py-1 text-sm  cursor-pointer`, {
              ' hover': activeTab === item.key
            })}
            onClick={() => setActiveTab(item.key)}
          >
            {item.label}
          </TagDiv>
        ))}
      </div>
      <div>{items.find(item => item.key === activeTab)?.children}</div>
    </div>
  )
}
