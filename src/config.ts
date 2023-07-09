import { readFileSync, existsSync } from "node:fs";
import { parse } from "yaml";
/**
 * 读取配置
 * @param url
 * @returns
 */
export function getYaml(url: string) {
  if (existsSync(url)) return parse(readFileSync(url, "utf8"));
  return false;
}

export function getJson(url: string) {
  if (existsSync(url)) return JSON.parse(readFileSync(url, "utf8"));
  return false;
}
