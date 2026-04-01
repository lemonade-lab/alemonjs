import React, { PropsWithChildren } from 'react';
import css_output from '@src/assets/main.css';
import { LinkStyleSheet } from 'jsxp';
export default function Html({ children }: PropsWithChildren) {
  return (
    <html>
      <head>
        <LinkStyleSheet src={css_output} />
      </head>
      <body>{children}</body>
    </html>
  );
}
