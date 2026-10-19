import { translate } from "../../../common/i18n.js";
import hello_html_default from "./hello.html.js";
import KoaRouter from "koa-router";

//#region src/core/cbp/routers/router.ts
const router = new KoaRouter({ prefix: "/" });
router.get("/", (ctx) => {
	ctx.status = 200;
	ctx.set("Content-Type", "text/html; charset=utf-8");
	ctx.body = hello_html_default;
});
router.get("api/online", (ctx) => {
	ctx.status = 200;
	ctx.body = {
		code: 200,
		message: translate("http.online"),
		data: {
			port: process.env._port ? Number(process.env._port) : null,
			serverPort: process.env._serverPort ? Number(process.env._serverPort) : null
		}
	};
});

//#endregion
export { router as default };