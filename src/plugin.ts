import { EventEnum, EventTypeEnum } from "./typings.js";
/**
 * 父类属性
 * @param name 类名
 * @param dsc 类说明
 * @param belong 事件响应
 * @param type 事件类型
 * @param priority 正则指令匹配数组
 * @param rule 事件类型
 */
export interface SuperType {
  name?: string;
  dsc?: string;
  belong?: EventEnum;
  type?: EventTypeEnum;
  priority?: number;
  rule?: Array<{
    //正则
    reg?: RegExp | string;
    //方法(函数)
    fnc: string;
  }>;
}
class plugin {
  name?: string;
  dsc?: string;
  belong?: EventEnum;
  type?: EventTypeEnum;
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
    belong = EventEnum.MESSAGES,
    type = EventTypeEnum.CREATE,
    priority = 5000,
    rule = [],
  }: SuperType) {
    this.name = name;
    this.dsc = dsc;
    this.belong = belong;
    this.type = type;
    this.priority = priority;
    this.rule = rule;
  }
}
export { plugin };
