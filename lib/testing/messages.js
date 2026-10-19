import { markdownToPlainText } from "../application/format/markdown-render.js";

//#region src/testing/messages.ts
function inspectMessage(nodes = []) {
	const commands = [];
	const walk = (values) => {
		for (const node of values) {
			if (Array.isArray(node)) {
				walk(node);
				continue;
			}
			if (!node || typeof node !== "object") continue;
			if (Array.isArray(node.value)) walk(node.value);
			if (["MD.button", "Button"].includes(node.type) && typeof node.options?.data === "string" && !["link", "call"].includes(node.options.type)) commands.push(node.options.data);
		}
	};
	walk(nodes);
	const plain = (node) => {
		if (Array.isArray(node)) return node.map(plain).join("");
		if (!node || typeof node !== "object") return "";
		if (node.type === "Markdown") return markdownToPlainText(node.value);
		if (node.type?.startsWith("MD.")) return markdownToPlainText([node]);
		if (node.type === "Text" || node.type === "Button") return String(node.value);
		if (Array.isArray(node.value)) return node.value.map(plain).join("");
		return "";
	};
	return {
		text: nodes.map(plain).join(""),
		commands
	};
}

//#endregion
export { inspectMessage };