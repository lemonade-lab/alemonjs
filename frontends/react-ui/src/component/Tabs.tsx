import classNames from 'classnames';
import { useEffect, useId, useState } from 'react';

export type TabsProps = {
  items: {
    key: string;
    label: string | React.ReactNode;
    children: React.ReactNode;
  }[];
};

export const Tabs = ({ items }: TabsProps) => {
  const [activeTab, setActiveTab] = useState<string | null>(() => items[0]?.key ?? null);
  const tabListId = useId();

  useEffect(() => {
    setActiveTab(currentTab => (items.some(item => item.key === currentTab) ? currentTab : items[0]?.key ?? null));
  }, [items]);

  const activeItem = items.find(item => item.key === activeTab);

  return (
    <div>
      <div
        className='flex border-b border-[var(--alemonjs-tabs-border)] bg-[var(--alemonjs-tabs-bg)] dark:border-[var(--alemonjs-dark-tabs-border)] dark:bg-[var(--alemonjs-dark-tabs-bg)]'
        role='tablist'
        aria-orientation='horizontal'
      >
        {items.map(item => (
          <button
            key={item.key}
            id={`${tabListId}-${item.key}-tab`}
            type='button'
            role='tab'
            aria-selected={activeTab === item.key}
            aria-controls={`${tabListId}-${item.key}-panel`}
            className={classNames(
              'relative -mb-px border-b-2 border-transparent px-3 py-2 text-sm transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--alemonjs-tabs-focus-ring)] focus-visible:ring-offset-2',
              'dark:focus-visible:ring-[var(--alemonjs-dark-tabs-focus-ring)] dark:focus-visible:ring-offset-[var(--alemonjs-dark-tabs-bg)]',
              {
                'bg-[var(--alemonjs-tabs-item-bg-active)] text-[var(--alemonjs-tabs-item-text-active)] border-[var(--alemonjs-tabs-item-border-active)] dark:bg-[var(--alemonjs-dark-tabs-item-bg-active)] dark:text-[var(--alemonjs-dark-tabs-item-text-active)] dark:border-[var(--alemonjs-dark-tabs-item-border-active)]':
                  activeTab === item.key,
                'text-[var(--alemonjs-tabs-item-text)] hover:bg-[var(--alemonjs-tabs-item-bg-hover)] hover:text-[var(--alemonjs-tabs-item-text-hover)] dark:text-[var(--alemonjs-dark-tabs-item-text)] dark:hover:bg-[var(--alemonjs-dark-tabs-item-bg-hover)] dark:hover:text-[var(--alemonjs-dark-tabs-item-text-hover)]':
                  activeTab !== item.key
              }
            )}
            onClick={() => setActiveTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {activeItem && (
        <div id={`${tabListId}-${activeItem.key}-panel`} role='tabpanel' aria-labelledby={`${tabListId}-${activeItem.key}-tab`}>
          {activeItem.children}
        </div>
      )}
    </div>
  );
};
