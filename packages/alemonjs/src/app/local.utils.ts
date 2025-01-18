export const ErrorModule = (e: Error) => {
  if (!e) return
  const moduleNotFoundRegex = /Cannot find (module|package)/
  if (moduleNotFoundRegex.test(e?.message)) {
    logger.error(e.message)
    const match = e.stack?.match(/'(.+?)'/)
    if (match) {
      const pack = match[1]
      logger.error(`缺少模块或依赖 ${pack} 请安装`)
    } else {
      logger.mark('无法提取缺失的信息，请检查')
    }
  } else {
    logger.error(e?.message)
  }
}
