import React from 'react'
export const LinkESM = ({
  src,
  ...props
}: React.DetailedHTMLProps<React.ScriptHTMLAttributes<HTMLScriptElement>, HTMLScriptElement> & {
  src: string
}) => <script type="module" src={src} {...props} />
