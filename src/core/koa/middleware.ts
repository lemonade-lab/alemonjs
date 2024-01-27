import koabodyparser from 'koa-bodyparser'
import koacors from 'koa2-cors'
import koarouter from 'koa-router'
import koastatic from 'koa-static'
import koawebsocket from 'koa-websocket'
import koa from 'koa'
export const AStatic = koastatic
export const ABodyParser = koabodyparser
export const ARouter = koarouter
export const ACors = koacors
export const AWebSocket = koawebsocket
export const AKoa = koa
