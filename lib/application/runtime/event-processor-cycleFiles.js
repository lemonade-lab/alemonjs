import { scopedMap, trackRuntimeTask } from "../../common/runtime-scope.js";
import { EventMessageText } from "../../common/variable.js";
import { getCachedRegExp, showErrorModule } from "../../common/utils.js";
import { dispatchEventError } from "./event-error.js";

//#region src/application/runtime/event-processor-cycleFiles.ts
const moduleCache = scopedMap();
/**
* 同步 select 预过滤 — 模块已缓存时 O(1) 跳过不匹配文件
* @returns true = 确定不匹配（可跳过）, false = 可能匹配或未缓存（需完整检查）
*/
const shouldSkipFile = (file, select, valueEvent) => {
	if (!moduleCache.has(file.path)) return false;
	const app = moduleCache.get(file.path);
	if (!app?.default?.current || !app?.default?.select) return true;
	if (!(Array.isArray(app.default.select) ? app.default.select : [app.default.select]).includes(select)) return true;
	if (EventMessageText.includes(select) && app?.regular) {
		if (!getCachedRegExp(app.regular).test(valueEvent["MessageText"])) return true;
	}
	return false;
};
/**
* 清除模块缓存（用于热更新等场景）
*/
const clearModuleCache = (path) => {
	if (path) moduleCache.delete(path);
	else moduleCache.clear();
};
const loadModule = async (filePath) => {
	if (moduleCache.has(filePath)) return moduleCache.get(filePath);
	const mod = await import(`file://${filePath}`);
	moduleCache.set(filePath, mod);
	return mod;
};
const callHandlerFile = async (valueEvent, select, file, nextStep, callback, phase) => {
	try {
		const app = await loadModule(file.path);
		if (!app?.default?.current || !app?.default?.select) {
			nextStep();
			return;
		}
		if (EventMessageText.includes(select)) {
			if (app?.regular) {
				if (!getCachedRegExp(app.regular).test(valueEvent["MessageText"])) {
					nextStep();
					return;
				}
			}
		}
		if (!(Array.isArray(app.default.select) ? app.default.select : [app.default.select]).includes(select)) {
			nextStep();
			return;
		}
		callback(app);
	} catch (err) {
		const shouldContinue = await dispatchEventError({
			event: valueEvent,
			error: err,
			appName: file.appName,
			phase
		});
		showErrorModule(err);
		if (shouldContinue) nextStep();
	}
};
/**
* @deprecated 已被 createFileTreeStep + MiddlewareTree 替代
* 创建 next 处理函数（扁平数组版）
* @param event
* @param select
*/
const createNextStep = (valueEvent, select, next, files, callHandler) => {
	let valueI = 0;
	/**
	* 下一步
	* @returns
	*/
	const nextStep = (cn, ...cns) => {
		if (cn) {
			next(...cns);
			return;
		}
		if (valueI >= files.length) {
			next();
			return;
		}
		trackRuntimeTask(calli());
	};
	/**
	* 执行 i
	* @returns
	*/
	const calli = async () => {
		if (valueI >= files.length) {
			nextStep();
			return;
		}
		valueI++;
		const file = files[valueI - 1];
		if (!file?.path) {
			nextStep();
			return;
		}
		const currents = [];
		await callHandlerFile(valueEvent, select, file, () => {
			nextStep();
		}, (app) => {
			const currentsItem = Array.isArray(app.default.current) ? app.default.current : [app.default.current];
			currents.push(...currentsItem);
		}, "response");
		if (currents.length > 0) callHandler(currents, nextStep);
	};
	return nextStep;
};
/**
* 创建文件树版的 next 处理函数
* 用树状 DFS 替代扁平遍历 + 运行时中间件查找，
* 中间件在每个树层级只执行一次，不再重复
*/
const createFileTreeStep = (valueEvent, select, next, root, callHandler, phase) => {
	/**
	* 处理树节点（DFS）
	* @param node 当前节点
	* @param done 本节点处理完毕后的回调
	*/
	const processNode = (node, done) => {
		if (node.middleware?.path) trackRuntimeTask(checkMiddleware(node, done));
		else trackRuntimeTask(processContent(node, done));
	};
	/**
	* 加载并检查本层中间件
	* 中间件 current 在该层级只执行一次（门控），通过后子节点不再重复执行
	*/
	const checkMiddleware = async (node, done) => {
		if (shouldSkipFile(node.middleware, select, valueEvent)) {
			trackRuntimeTask(processContent(node, done));
			return;
		}
		let matched = false;
		const mwCurrents = [];
		await callHandlerFile(valueEvent, select, node.middleware, () => {
			trackRuntimeTask(processContent(node, done));
		}, (app) => {
			matched = true;
			const items = Array.isArray(app.default.current) ? app.default.current : [app.default.current];
			mwCurrents.push(...items);
		}, "middleware");
		if (matched) {
			if (mwCurrents.length === 0) {
				trackRuntimeTask(processContent(node, done));
				return;
			}
			callHandler(mwCurrents.concat([(_event, gateNext) => {
				gateNext();
				return true;
			}]), (cn, ...cns) => {
				if (cn) {
					done(true, ...cns);
					return;
				}
				trackRuntimeTask(processContent(node, done));
			}, {
				appName: node.middleware?.appName,
				phase
			});
		}
	};
	/**
	* 处理节点内容：先处理当前层文件，再递归子节点
	*/
	const processContent = (node, done) => {
		processFiles(node, 0, () => {
			processChildNodes(node, done);
		}, done);
	};
	/**
	* 依次处理本层的 handler 文件
	*/
	const processFiles = (node, idx, filesDone, treeDone) => {
		if (idx >= node.files.length) {
			filesDone();
			return;
		}
		const file = node.files[idx];
		if (!file?.path) {
			processFiles(node, idx + 1, filesDone, treeDone);
			return;
		}
		if (shouldSkipFile(file, select, valueEvent)) {
			processFiles(node, idx + 1, filesDone, treeDone);
			return;
		}
		trackRuntimeTask(callHandlerFile(valueEvent, select, file, () => {
			processFiles(node, idx + 1, filesDone, treeDone);
		}, (app) => {
			callHandler(Array.isArray(app.default.current) ? app.default.current : [app.default.current], (cn, ...cns) => {
				if (cn) treeDone(true, ...cns);
				else processFiles(node, idx + 1, filesDone, treeDone);
			}, {
				appName: file.appName,
				phase
			});
		}, phase));
	};
	/**
	* 依次递归处理子节点
	*/
	const processChildNodes = (node, done) => {
		const childKeys = Array.from(node.children.keys());
		let childIdx = 0;
		const nextChild = (...cns) => {
			if (cns.length > 0 && cns[0]) {
				done(...cns);
				return;
			}
			if (childIdx >= childKeys.length) {
				done();
				return;
			}
			const childNode = node.children.get(childKeys[childIdx++]);
			if (childNode) processNode(childNode, nextChild);
			else nextChild();
		};
		nextChild();
	};
	const startStep = (cn, ...cns) => {
		if (cn) {
			next(...cns);
			return;
		}
		processNode(root, next);
	};
	return startStep;
};

//#endregion
export { clearModuleCache, createFileTreeStep, createNextStep };