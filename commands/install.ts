import prompts from "prompts";
import { existsSync, mkdirSync } from "fs";
import { spawn } from "child_process";
/**
 * 执行指令
 * @param command  指令
 * @param args  参数
 * @param options 选项
 * @returns
 */
function runCommand(command: string, args: string[], options: any) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);

    child.stdout.on("data", (data) => {
      console.log(data.toString());
    });

    child.stderr.on("data", (data) => {
      console.error(data.toString());
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Command "${command}" failed with exit code ${code}`));
      } else {
        resolve("ok");
      }
    });
  });
}

//
prompts([
  {
    type: "text",
    name: "name",
    message: "robot name :",
    validate: async (value: any) => {
      if (existsSync(`./${value}`)) return "Robot name already exists!";
      return /^[a-z][0-9a-z_-]{0,}$/.test(value)
        ? true
        : "首字母小写,可选符号数字、小写字母、_和-";
    },
    initial: process.argv[3] ? process.argv[3] : "yunzai-bot",
  },
  {
    type: "select",
    name: "source",
    message: "Choose an installation bot :",
    choices: [
      { title: "Alemon-qq @频道机器人", value: "0" },
      { title: "Alemon-mys @别野机器人", value: "1" },
    ],
    initial: 0,
  },
  {
    type: "text",
    name: "isPlugin",
    message: "Are you sure to install \n the miao-plugin?(y/n) :",
    initial: () => {
      if (process.argv[4] == "n") {
        return "n";
      } else if (process.argv[4] == "y") {
        return "y";
      } else {
        return "y";
      }
    },
  },
])
  .then(async ({ name, isPlugin, source }) => {
    // 强制退出错误
    if (!name || !isPlugin || !source) process.exit();
    const dirPath = `./${name}`;
    mkdirSync(dirPath);
    console.log(`\n`);
    const SourceMap = {
      0: "-b main https://gitee.com/ningmengchongshui/alemon-bot.git",
      1: "-b main https://gitee.com/ningmengchongshui/alemon-bot.git",
    };

    try {
      await runCommand(
        "git",
        ["clone", "--depth=1", SourceMap[source], dirPath],
        { cwd: process.cwd() }
      );
    } catch (error) {
      console.log(`Yunzai-Bot ${error}`);
      return;
    }

    if (isPlugin != "n") {
      try {
        await runCommand(
          "git",
          [
            "clone",
            "--depth=1",
            "-b plugin https://gitee.com/ningmengchongshui/alemon-bot.git",
            `${dirPath}/plugins/alemon-plugin`,
          ],
          { cwd: process.cwd() }
        );
      } catch (error) {
        console.log(`miao-Plugin installation failed!`);
      }
    }

    console.log(`------------------------------------`);
    console.log("---alemon-Bot cloned successfully!--");
    console.log(`------------------------------------`);
    console.log(`cd ${name}      #Entering`);
    console.log(`npm install     #Load`);
    console.log(`npm run app     #Firing`);
    console.log(`------------------------------------`);
  })
  .catch((err) => {
    console.log(err);
    return;
  });
