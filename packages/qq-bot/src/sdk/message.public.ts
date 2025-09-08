import { ERROR_TYPE } from '../message/ERROR';
import { INTERACTION_CREATE_TYPE } from '../message/INTERACTION_CREATE';
export type QQBotPublicEventMap = {
  INTERACTION_CREATE: INTERACTION_CREATE_TYPE;
  ERROR: ERROR_TYPE;
};
