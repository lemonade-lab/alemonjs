import { Result } from "../../common/result.js";
import { ActionContext, Menu } from "../../types/messaging.js";
import "../../types/index.js";
import "./common.js";
//#region src/application/hooks/menu.d.ts
/** Configure the bot's conversation menu. */
declare const useMenu: (context?: ActionContext) => readonly [{
  readonly get: () => Promise<Result<{
    menu?: Menu;
    version: number;
  }>>;
  readonly set: (menu: Menu) => Promise<Result<{
    version: number;
  }>>;
}];
//#endregion
export { useMenu };