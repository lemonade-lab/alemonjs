import type { MilkyEvent } from './types';

export type MilkyEventMap = {
  /** Raw Milky event, dispatched for every event_type. */
  EVENT: MilkyEvent;
  /** Emitted after get_login_info succeeds. */
  READY: {
    self_id: string | number;
    info?: any;
    [key: string]: any;
  };
};
