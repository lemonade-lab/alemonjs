import { lazy } from 'alemonjs';

export default defineMiddleware([
  {
    regular: /^(#|\/)?test/,
    handler: lazy(() => import('./response/test/res'))
  },
  {
    regular: /^(#|\/)?image/,
    handler: lazy(() => import('./response/image/res'))
  },
  {
    regular: /^(#|\/)?mentions/,
    handler: lazy(() => import('./response/mentions/res'))
  }
]);
