import { Button } from '@alemonjs/react-ui'
import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react'

export const DivButton = forwardRef(
  (
    {
      cd,
      disabledOnWait,
      onClick,
      onChildren,
      children,
      style
    }: {
      cd?: number
      disabledOnWait?: boolean
      onClick: Function
      onChildren?: (open: boolean, leftCD: number) => React.ReactNode
      children?: React.ReactNode
      style?: React.CSSProperties
    },
    ref
  ) => {
    const defaultWait: {
      enable: boolean
      cd: number
    } = {
      enable: false,
      cd: cd || 0
    }

    const [wait, setWait] = useState(defaultWait)
    const timeoutRef = useRef<NodeJS.Timeout>(undefined)

    const handleClick = (e: React.FormEvent<HTMLButtonElement>) => {
      if (cd) {
        if (wait.enable) {
          clearInterval(timeoutRef.current)
          setWait(defaultWait)
        } else {
          setWait({ ...wait, enable: true })
          timeoutRef.current = setInterval(() => {
            setWait(prev => {
              if (prev.cd <= 1) {
                clearInterval(timeoutRef.current)
                return defaultWait
              } else {
                return { enable: true, cd: prev.cd - 1 }
              }
            })
          }, 1000)
          onClick(e, wait)
        }
      } else {
        onClick(e, wait)
      }
    }

    useImperativeHandle(ref, () => ({
      clearInterval() {
        clearInterval(timeoutRef.current)
        setWait(defaultWait)
      }
    }))

    return (
      <Button
        disabled={wait.enable && (disabledOnWait || false)}
        type="button"
        className={`w-full flex justify-center items-center bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition duration-200`}
        style={{ backgroundColor: wait.enable ? 'rgb(29 78 216 / 0.8)' : undefined, ...style }}
        onClick={handleClick}
      >
        {onChildren && onChildren(wait.enable, wait.cd)}
        {children}
      </Button>
    )
  }
)
