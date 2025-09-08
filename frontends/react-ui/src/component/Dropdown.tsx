import { SecondaryDiv } from './SecondaryDiv';
import React, { useState, useRef, memo, PropsWithChildren } from 'react';
import classNames from 'classnames';
import { Button } from './Button';

export type DropdownProps = PropsWithChildren<{
  buttons: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>[];
  placement?: 'bottomLeft' | 'bottom' | 'bottomRight' | 'topLeft' | 'top' | 'topRight';
}>;

export const Dropdown = memo(({ children, buttons, placement = 'bottom' }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const toggleDropdown = () => {
    // 禁止冒泡
    setIsOpen(prev => !prev);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  React.useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getPlacementClasses = () => {
    switch (placement) {
      case 'bottomRight':
        return 'left-0 mt-2';
      case 'bottom':
        return 'left-1/2 transform -translate-x-1/2 mt-2';
      case 'bottomLeft':
        return 'right-0 mt-2';
      case 'topRight':
        return 'left-0 bottom-full mb-2';
      case 'top':
        return 'left-1/2 transform -translate-x-1/2 bottom-full mb-2';
      case 'topLeft':
        return 'right-0 bottom-full mb-2';
      default:
        return 'left-1/2 transform -translate-x-1/2 mt-2';
    }
  };

  return (
    <div className='relative' ref={dropdownRef}>
      {isOpen && (
        <SecondaryDiv className={classNames('absolute z-20 bg-opacity-90 border rounded-md shadow-md ', getPlacementClasses())}>
          <div className='flex flex-col gap-2 p-2'>
            {buttons.map((button, index) => (
              <Button
                key={index}
                className='px-3 py-1 min-w-16 rounded-md whitespace-nowrap'
                onClick={e => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                {...button}
              />
            ))}
          </div>
        </SecondaryDiv>
      )}
      <div
        onClick={e => {
          e.stopPropagation();
          toggleDropdown();
        }}
        className='z-10'
      >
        {children}
      </div>
    </div>
  );
});
