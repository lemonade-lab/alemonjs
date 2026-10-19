import { ResultCode } from "../../common/variable.js";
import { getConfig } from "../../common/config.js";
import { ChildrenApp, State, StateSubscribe } from "./store.js";

//#region src/application/runtime/event-utils.ts
/**
* 卸载模块
* @param name
* @throws {Error} - 如果 name 无效，抛出错误。
*/
const unChildren = (name = "main") => {
	if (!name || typeof name !== "string") {
		logger.error({
			code: ResultCode.FailParams,
			message: "Invalid name: name must be a string",
			data: null
		});
		throw new Error("Invalid name: name must be a string");
	}
	new ChildrenApp(name).un();
};
/**
* 创建选择器
* @param values
* @returns
*/
const onSelects = (values) => values;
global.onSelects = onSelects;
/**
* 废弃,请使用onSelects
* @deprecated
* @param values
* @returns
*/
const createSelects = onSelects;
/**
* 创建原生value映射
* @deprecated 试验性功能，请勿使用
* @param event
* @returns
*/
const createEventValue = (event) => {
	return event.value;
};
/**
* 获取指定功能是启动还是关闭
* ***
* 当有其他地方调用时，
* 默认值以第一次调用为准
* ***
* 功能名相同时，
* 将会同时改变，因为状态是全局的
* @param name 功能名
* @param defaultValue 默认值，默认为 true
* @deprecated 废弃。指令管理可直接配置禁用正则
* @throws {Error} - 如果 name 不是字符串，或者 defaultValue 不是布尔值，抛出错误。
*/
const useState = (name, defaultValue = true) => {
	if (typeof name !== "string") {
		logger.error({
			code: ResultCode.FailParams,
			message: "Invalid name: name must be a string",
			data: null
		});
		throw new Error("Invalid name: name must be a string");
	}
	if (typeof defaultValue !== "boolean") {
		logger.error({
			code: ResultCode.FailParams,
			message: "Invalid defaultValue: defaultValue must be a boolean",
			data: null
		});
		throw new Error("Invalid defaultValue: defaultValue must be a boolean");
	}
	const state = new State(name, defaultValue);
	const setValue = (value) => {
		if (state.value === value) return;
		state.value = value;
		const cfg = getConfig();
		cfg.value.core ??= {};
		cfg.value.core.state ??= [];
		const exists = cfg.value.core.state.includes(name);
		if (value && exists) cfg.value.core.state = cfg.value.core.state.filter((i) => i !== name);
		else if (!value && !exists) cfg.value.core.state.push(name);
		cfg.saveValue(cfg.value);
	};
	return [state.value, setValue];
};
/**
* 订阅状态变化
* @param name 功能名
* @param callback 回调函数
* @deprecated 废弃。指令管理可直接配置禁用正则
* @throws {Error} - 如果 callback 无效，抛出错误。
*/
const onState = (name, callback) => {
	if (typeof callback !== "function") {
		logger.error({
			code: ResultCode.FailParams,
			message: "Callback must be a function",
			data: null
		});
		throw new Error("Callback must be a function");
	}
	new StateSubscribe(name).on(callback);
};
/**
* 取消订阅状态变化
* @param name 功能名
* @param callback 回调函数
* @deprecated 废弃。指令管理可直接配置禁用正则
* @throws {Error} - 如果 callback 无效，抛出错误。
*/
const unState = (name, callback) => {
	if (typeof callback !== "function") {
		logger.error({
			code: ResultCode.FailParams,
			message: "Callback must be a function",
			data: null
		});
		throw new Error("Callback must be a function");
	}
	new StateSubscribe(name).un(callback);
};

//#endregion
export { createEventValue, createSelects, onSelects, onState, unChildren, unState, useState };