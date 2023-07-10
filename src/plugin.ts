import { SuperType, EventTypeEnum } from "./types.js";
import { EventEnum } from "./typings.js";
class plugin {
  name?: string;
  dsc?: string;
  event?: EventEnum;
  eventType?: EventTypeEnum;
  priority?: number;
  rule?: Array<{
    //正则
    reg?: RegExp | string;
    //方法(函数)
    fnc: string;
  }>;
  /**
   * @param name 类名标记  用于特殊需要时的唯一标记
   * @param dsc 类名描述   用于描述该类的主要作用
   * @param event 事件类型
   * @param eventType 消息类型
   * @param priority 优先级      数字越小优先级越高
   * @param rule.reg 命令正则      RegExp(rule.reg)
   * @param rule.fnc 命令执行方法    function
   */
  constructor({
    name = "your-name",
    dsc = "dsc",
    event = EventEnum.MESSAGES,
    eventType = EventTypeEnum.CREATE,
    priority = 5000,
    rule = [],
  }: SuperType) {
    this.name = name;
    this.dsc = dsc;
    this.event = event;
    this.eventType = eventType;
    this.priority = priority;
    this.rule = rule;
  }
}
export { plugin };
