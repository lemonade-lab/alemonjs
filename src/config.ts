import { readFileSync, existsSync } from "node:fs";
import { parse } from "yaml";
/**
 * 读取yaml数据
 * @param url 绝对路径
 * @returns
 */
export function getYaml(url: string) {
  if (existsSync(url)) return parse(readFileSync(url, "utf8"));
  return false;
}
/**
 * 读取json数据
 * @param url 绝对路径
 * @returns
 */
export function getJson(url: string) {
  if (existsSync(url)) return JSON.parse(readFileSync(url, "utf8"));
  return false;
}
