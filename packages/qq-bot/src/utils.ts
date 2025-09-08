/**
 *
 * @param str
 * @returns
 */
export const isGuild = (str: string) => {
  // guild ID 纯数字，例如：11586990140073229091
  // 转换失败，是群id。return false
  if (isNaN(Number(str.substring(0, 6)))) {
    return false;
  }

  return true;
};
