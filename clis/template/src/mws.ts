import { lazy } from 'alemonjs';

export default defineMiddleware([
  {
    handler: lazy(() => import('./middleware/mw'))
  }
]);
