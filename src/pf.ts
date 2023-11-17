/**
 * Villa自动排咧
 * @param arr
 * @returns
 */
export function buttonAutomaticArrangement(arr: any[]) {
  const mid = []
  const big = []
  if (arr.length % 3 == 2) {
    mid.push(arr.pop())
    mid.push(arr.pop())
  } else if (arr.length % 3 == 1) {
    big.push(arr.pop())
  }
  return {
    big_component_group_list: big.length != 0 ? [big] : [], // 1
    mid_component_group_list: mid.length != 0 ? [mid] : [], // 2
    small_component_group_list: arr.length != 0 ? [arr] : [] // 3
  }
}
