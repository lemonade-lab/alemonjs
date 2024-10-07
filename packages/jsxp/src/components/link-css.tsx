import React from 'react'
export const LinkStyleSheet = ({
  src,
  ...props
}: React.DetailedHTMLProps<React.HTMLAttributes<HTMLLinkElement>, HTMLLinkElement> & {
  src: string
}) => <link rel="stylesheet" href={src} {...props} />
