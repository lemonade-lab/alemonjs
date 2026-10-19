//#region src/common/react.ts
const DOCTYPE = "<!DOCTYPE html>";
const escapeHtml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
function createElement(type, props, ...children) {
	props = props || {};
	const flatChildren = children.flat(Infinity).filter((c) => c !== false && c !== null && c !== void 0);
	return {
		type,
		props,
		children: flatChildren
	};
}
var Component = class {
	props;
	state;
	constructor(props) {
		this.props = props;
		this.state = {};
	}
	setState(partial) {
		this.state = Object.assign({}, this.state, partial);
	}
	render() {
		return "";
	}
	static renderToString() {
		return renderToString(createElement(this, null));
	}
	static renderToHtml() {
		return DOCTYPE + this.renderToString();
	}
};
function attrsToString(props = {}) {
	const parts = [];
	for (const key of Object.keys(props)) {
		if (key === "children" || key === "dangerouslySetInnerHTML") continue;
		const val = props[key];
		if (val === false || val === void 0 || val === null) continue;
		if (key === "className") {
			parts.push(`class="${escapeHtml(String(val))}"`);
			continue;
		}
		if (key === "style" && typeof val === "object") {
			const styleStr = Object.entries(val).map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}:${v}`).join(";");
			parts.push(`style="${escapeHtml(styleStr)}"`);
			continue;
		}
		if (val === true) {
			parts.push(`${key}`);
			continue;
		}
		parts.push(`${key}="${escapeHtml(String(val))}"`);
	}
	return parts.length ? " " + parts.join(" ") : "";
}
const voidTags = /* @__PURE__ */ new Set([
	"area",
	"base",
	"br",
	"col",
	"embed",
	"hr",
	"img",
	"input",
	"link",
	"meta",
	"param",
	"source",
	"track",
	"wbr"
]);
const rawTextTags = /* @__PURE__ */ new Set(["script", "style"]);
function renderRawText(vnode) {
	if (vnode === null || vnode === void 0 || vnode === false) return "";
	if (typeof vnode === "string" || typeof vnode === "number") return String(vnode);
	return renderToString(vnode);
}
function renderToString(vnode) {
	if (vnode === null || vnode === void 0 || vnode === false) return "";
	if (typeof vnode === "string" || typeof vnode === "number") return escapeHtml(String(vnode));
	if (typeof vnode === "object" && vnode.type === void 0) return (vnode.children ?? []).map(renderToString).join("");
	if (typeof vnode.type === "function") {
		const Comp = vnode.type;
		if (Comp.prototype && typeof Comp.prototype.render === "function") return renderToString(new Comp(Object.assign({}, vnode.props, { children: vnode.children })).render());
		else return renderToString(Comp(Object.assign({}, vnode.props, { children: vnode.children })));
	}
	const tag = String(vnode.type);
	const props = vnode.props ?? {};
	if (props?.dangerouslySetInnerHTML && typeof props.dangerouslySetInnerHTML === "object" && props.dangerouslySetInnerHTML.__html !== null) return `<${tag}${attrsToString(props)}>${String(props.dangerouslySetInnerHTML.__html)}</${tag}>`;
	const attrs = attrsToString(props);
	if (voidTags.has(tag.toLowerCase())) return `<${tag}${attrs} />`;
	return `<${tag}${attrs}>${rawTextTags.has(tag.toLowerCase()) ? (vnode.children ?? []).map(renderRawText).join("") : (vnode.children ?? []).map(renderToString).join("")}</${tag}>`;
}
function makeTag(tag) {
	return function tagFactory(first, ...restChildren) {
		const looksLikeVNode = first !== null && typeof first === "object" && !Array.isArray(first) && Object.prototype.toString.call(first) === "[object Object]" && ("type" in first || "children" in first);
		if (first !== null && typeof first === "object" && !Array.isArray(first) && Object.prototype.toString.call(first) === "[object Object]" && !looksLikeVNode) return createElement(tag, first, ...restChildren);
		else {
			const children = [];
			if (first !== void 0 && first !== null) children.push(first);
			children.push(...restChildren);
			return createElement(tag, null, ...children);
		}
	};
}
const Html = makeTag("html");
const Head = makeTag("head");
const Body = makeTag("body");
const Title = makeTag("title");
const Style = makeTag("style");
const H1 = makeTag("h1");
const P = makeTag("p");
const A = makeTag("a");
const Div = makeTag("div");

//#endregion
export { A, Body, Component, DOCTYPE, Div, H1, Head, Html, P, Style, Title, createElement, renderToString };