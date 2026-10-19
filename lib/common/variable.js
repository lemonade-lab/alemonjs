//#region src/common/variable.ts
const processorRepeatedEventTime = 6e4;
const processorRepeatedUserTime = 1e3;
const processorRepeatedClearTimeMin = 3e3;
const processorRepeatedClearTimeMax = 1e4;
const processorRepeatedClearSize = 37;
const processorMaxMapSize = 1e4;
const fileSuffixMiddleware = /^mw(\.|\..*\.)(js|ts|jsx|tsx)$/;
const fileSuffixResponse = /^res(\.|\..*\.)(js|ts|jsx|tsx)$/;
const filePrefixCommon = /^(@alemonjs\/|alemonjs-)/;
const defaultPort = 17117;
const defaultLogin = "gui";
const defaultPlatformPrefix = "alemonjs-";
const defaultPlatformCommonPrefix = "@alemonjs/";
const Ok = 2e3;
const Warn = 2100;
const Fail = 4e3;
const FailParams = 4001;
const FailAuth = 4002;
const FailInternal = 5e3;
const EventMessageText = [
	"message.create",
	"private.message.create",
	"interaction.create",
	"private.interaction.create"
];
const ResultCode = {
	Ok,
	Fail,
	FailParams,
	Warn,
	FailAuth,
	FailInternal
};
var Result = class Result {
	#data = [];
	#currentIndex = 0;
	get value() {
		return this.#data;
	}
	static create() {
		return new Result();
	}
	push(param) {
		this.#data.push(param);
		return this;
	}
	newIndex() {
		if (this.#data[this.#currentIndex]) this.#currentIndex++;
		return this;
	}
	updateMessage(msg) {
		if (!this.#data[this.#currentIndex]) this.#data[this.#currentIndex] = {
			code: ResultCode.Ok,
			message: msg,
			data: null
		};
		this.#data[this.#currentIndex].message = msg;
		return this;
	}
	updateData(data) {
		if (!this.#data[this.#currentIndex]) this.#data[this.#currentIndex] = {
			code: ResultCode.Ok,
			message: "",
			data
		};
		this.#data[this.#currentIndex].data = data;
		return this;
	}
	updateCode(callback) {
		const newCode = callback(ResultCode);
		if (!this.#data[this.#currentIndex]) this.#data[this.#currentIndex] = {
			code: newCode,
			message: "",
			data: null
		};
		else this.#data[this.#currentIndex].code = newCode;
		return this;
	}
};

//#endregion
export { EventMessageText, Fail, FailAuth, FailInternal, FailParams, Ok, Result, ResultCode, Warn, defaultLogin, defaultPlatformCommonPrefix, defaultPlatformPrefix, defaultPort, filePrefixCommon, fileSuffixMiddleware, fileSuffixResponse, processorMaxMapSize, processorRepeatedClearSize, processorRepeatedClearTimeMax, processorRepeatedClearTimeMin, processorRepeatedEventTime, processorRepeatedUserTime };