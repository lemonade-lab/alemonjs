import { ButtonType } from './types.js'
/**
 * Villa按钮自动排咧
 * @param arr
 * @returns
 */
export function buttonAutomaticArrangement(arr: ButtonType[] = []) {
  const small = []
  const mid = []
  const big = []
  for (const item of arr) {
    if (!item.text?.length && item.text.length == 0) {
      continue
    }
    if (item.text.length <= 2) {
      small.push(item)
      continue
    }
    if (item.text.length <= 4) {
      mid.push(item)
      continue
    }
    if (item.text.length <= 10) {
      big.push(item)
      continue
    }
  }

  // 应该先按照数字大小分 三个类  再进行 分类中的小分区

  const small_component_group_list = []
  const mid_component_group_list = []
  const big_component_group_list = []

  let slist = []
  for (const item of small) {
    // 装进去
    if (slist.length < 3) {
      slist.push(item)
    } else {
      // 第三个进去
      small_component_group_list.push(slist)
      slist = []
      slist.push(item)
    }
  }

  // 如果是刚好三个
  if (slist.length == 3) {
    small_component_group_list.push(slist)
    slist = []
  }

  // 如果是 1 或 2 个  进入下一个批次
  for (const item of slist) {
    mid.push(item)
  }

  let mlist = []
  for (const item of mid) {
    if (mlist.length < 2) {
      mlist.push(item)
    } else {
      // 第二个进去
      mid_component_group_list.push(mlist)
      mlist = []
      mlist.push(item)
    }
  }

  // 如果是 2 进进入
  if (mlist.length == 2) {
    mid_component_group_list.push(mlist)
    mlist = []
  }

  // 所有的都排出来进入big
  for (const item of mlist) {
    big.push(item)
  }

  // 剩下所有big的直接单个格子
  for (const item of big) {
    big_component_group_list.push([item])
  }

  return {
    big_component_group_list: big_component_group_list, // 1
    mid_component_group_list: mid_component_group_list, // 2
    small_component_group_list: small_component_group_list // 3
  }
}
