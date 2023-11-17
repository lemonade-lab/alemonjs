/**
 * Villa按钮自动排咧
 * @param arr
 * @returns
 */
export function buttonAutomaticArrangement(
  arr: {
    id: string
    text: string
    type?: number
    c_type?: number
    link?: string
    input?: string
    need_callback?: boolean
    need_token?: boolean
    extra?: string
  }[] = []
) {
  const small = []
  const mid = []
  const big = []
  for (const item of arr) {
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
      // 大了 就要做记录
      small_component_group_list.push(slist)
      slist = []
    }
  }

  if (slist.length == 3) {
    small_component_group_list.push(slist)
    slist = []
  }

  // 如果   slist是 1 slist是  2 就留到下一批
  for (const item of slist) {
    mid.push(item)
  }

  let mlist = []
  for (const item of mid) {
    if (mlist.length < 2) {
      mlist.push(item)
    } else {
      mid_component_group_list.push(mlist)
      mlist = []
    }
  }

  if (mlist.length == 2) {
    mid_component_group_list.push(mlist)
    mlist = []
  }

  for (const item of mlist) {
    big_component_group_list.push([item])
  }

  for (const item of big) {
    big_component_group_list.push([item])
  }

  return {
    big_component_group_list: big_component_group_list, // 1
    mid_component_group_list: mid_component_group_list, // 2
    small_component_group_list: small_component_group_list // 3
  }
}
