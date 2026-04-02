import { SecondaryDiv } from './SecondaryDiv';
import React, { useState, useRef, useCallback, useLayoutEffect, memo, PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import { Button } from './Button';

const GAP = 4;

export type DropdownProps = PropsWithChildren<{
  buttons: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>[];
  placement?: 'bottomLeft' | 'bottom' | 'bottomRight' | 'topLeft' | 'top' | 'topRight';
}>;

/**
 * 根据触发器和弹层尺寸、期望方向，计算最终位置，必要时自动翻转。
 */
function calcPosition(triggerRect: DOMRect, popupRect: DOMRect, placement: NonNullable<DropdownProps['placement']>) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // 判断垂直方向是否需要翻转
  const wantBottom = placement.startsWith('bottom');
  const spaceBelow = vh - triggerRect.bottom;
  const spaceAbove = triggerRect.top;
  let vertical: 'bottom' | 'top';
  if (wantBottom) {
    vertical = spaceBelow >= popupRect.height + GAP ? 'bottom' : spaceAbove >= popupRect.height + GAP ? 'top' : 'bottom';
  } else {
    vertical = spaceAbove >= popupRect.height + GAP ? 'top' : spaceBelow >= popupRect.height + GAP ? 'bottom' : 'top';
  }

  // 计算 top
  let top: number;
  if (vertical === 'bottom') {
    top = triggerRect.bottom + GAP;
  } else {
    top = triggerRect.top - popupRect.height - GAP;
  }

  // 计算水平对齐
  const align = placement.replace(/^(top|bottom)/, '') as '' | 'Left' | 'Right';
  let left: number;
  switch (align) {
    case 'Right':
      // 弹层左边与触发器左边对齐
      left = triggerRect.left;
      break;
    case 'Left':
      // 弹层右边与触发器右边对齐
      left = triggerRect.right - popupRect.width;
      break;
    default:
      // 居中
      left = triggerRect.left + triggerRect.width / 2 - popupRect.width / 2;
      break;
  }

  // 水平边界修正
  if (left < 0) left = 0;
  if (left + popupRect.width > vw) left = vw - popupRect.width;

  // 垂直边界修正
  if (top < 0) top = 0;
  if (top + popupRect.height > vh) top = vh - popupRect.height;

  return { top, left };
}

export const Dropdown = memo(({ children, buttons, placement = 'bottom' }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const triggerEl = triggerRef.current;
    const popupEl = popupRef.current;
    if (!triggerEl || !popupEl) return;
    const triggerRect = triggerEl.getBoundingClientRect();
    const popupRect = popupEl.getBoundingClientRect();
    setPos(calcPosition(triggerRect, popupRect, placement));
  }, [placement]);

  // 打开时计算位置，并监听 scroll/resize 重定位
  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  // 点击外部关闭
  React.useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current && !triggerRef.current.contains(target) && popupRef.current && !popupRef.current.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      <div
        ref={triggerRef}
        onClick={e => {
          e.stopPropagation();
          setIsOpen(prev => !prev);
        }}
        className='relative z-10'
      >
        {children}
      </div>
      {isOpen &&
        createPortal(
          <div ref={popupRef} style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 50 }}>
            <SecondaryDiv className={classNames('bg-opacity-90 border rounded-md shadow-md')}>
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
          </div>,
          document.body
        )}
    </>
  );
});
