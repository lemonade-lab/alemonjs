import { DataEnums } from "../types/message/index.js";
import { ActionTarget } from "../types/actions.js";
import "../types/index.js";
//#region src/testing/messages.d.ts
type TestMessage = {
  /** Snapshot of the original Format nodes, including nesting and options. */
  nodes: DataEnums[];
  content?: unknown;
  target?: ActionTarget;
  text: string;
  commands: string[];
  /** Includes failed attempts. Index in this run's actions array. */
  actionIndex: number;
};
declare function inspectMessage(nodes?: DataEnums[]): {
  text: string;
  commands: string[];
};
//#endregion
export { TestMessage, inspectMessage };