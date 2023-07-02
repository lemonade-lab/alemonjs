import { exec } from "child_process";
/**
 * 执行指令
 * @param command
 * @returns
 */
export function exe(command: string): Promise<unknown> {
  return new Promise((resolve) => {
    exec(command, (err, stdout) => {
      if (err) {
        console.info(err);
        process.exit();
      } else {
        resolve(stdout);
      }
    });
  });
}
