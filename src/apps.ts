import { readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// 非依赖引用
import { setApp } from "./message.js";

/**
 * 递归得到所有js/ts文件绝对路径
 * @param dirPath 指定目录下
 * @returns
 */
function getAllJsAndTsFilesSync(dirPath: string) {
  const files = [];
  const entries = readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      // 递归获取子目录中的文件路径
      files.push(...getAllJsAndTsFilesSync(fullPath));
    } else if (entry.isFile() && /\.(js|ts)$/i.test(entry.name)) {
      // 如果是以 .js 或 .ts 结尾的文件，则将其路径保存到数组中
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * 创建插件应用
 * @param AppName  插件名（与插件名相同）
 * @param DirName 应用地址（默认为apps）
 * @returns
 */
export const createApps = async (
  AppName: string,
  DirName?: string
): Promise<object> => {
  const filepath = join(
    process.cwd(),
    "plugins",
    AppName,
    DirName ? DirName : "apps"
  );
  const apps: object = {};
  mkdirSync(filepath, { recursive: true });
  const arr = getAllJsAndTsFilesSync(filepath);
  for await (let AppDir of arr) {
    //文件对象:对象中有多个class
    const dirObject = await import(`file://${AppDir}`).catch((err) => {
      console.error(AppName);
      console.error(err);
      return {};
    });
    for (let item in dirObject) {
      //如果该导出是class
      if (dirObject[item].prototype) {
        //如果没发现有
        if (apps.hasOwnProperty(item)) {
          console.error(`[同名class export]  ${AppDir}`);
        }
        apps[item] = dirObject[item];
      } else {
        console.error(`[非class export]  ${AppDir}`);
      }
    }
  }
  setApp(AppName, apps);
  return apps;
};

// /**
//  * 测试函数|不可使用
//  * @param AppName
//  * @returns
//  */
// export function createApp(AppName: string) {
//   return {
//     plugins: (app: { AppName: string; apps: object }) => {
//       setApp(app.AppName, app.apps);
//     },
//     mount: async (DirName: string) => {
//       const filepath = join(
//         process.cwd(),
//         "plugins",
//         AppName,
//         DirName ? DirName : "apps"
//       );
//       const apps: object = {};
//       mkdirSync(filepath, { recursive: true });
//       const arr = getAllJsAndTsFilesSync(filepath);
//       for await (let AppDir of arr) {
//         //文件对象:对象中有多个class
//         const dirObject = await import(`file://${AppDir}`).catch((err) => {
//           console.error(AppName);
//           console.error(err);
//           return {};
//         });
//         for (let item in dirObject) {
//           //如果该导出是class
//           if (dirObject[item].prototype) {
//             //如果没发现有
//             if (apps.hasOwnProperty(item)) {
//               console.error(`[同名class export]  ${AppDir}`);
//             }
//             apps[item] = dirObject[item];
//           } else {
//             console.error(`[非class export]  ${AppDir}`);
//           }
//         }
//       }
//       setApp(AppName, apps);
//       return apps;
//     },
//   };
// }

/**
 *  const app = reateApp(AppName)
 *  app.mount('apps')
 */

// const app = createApp("x");

// app.mount("apps");
