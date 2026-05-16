import type { Result } from '../../../../common/index.js';

type RequestReplyValue = Result[] | PromiseLike<Result[]>;
type RequestReplyResolve = (value: RequestReplyValue) => void;

export const actionRequestResolves = new Map<string, RequestReplyResolve>();
export const apiRequestResolves = new Map<string, RequestReplyResolve>();
export const actionRequestTimeouts = new Map<string, NodeJS.Timeout>();
export const apiRequestTimeouts = new Map<string, NodeJS.Timeout>();
