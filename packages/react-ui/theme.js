if (process.env.ALEMONJS_CSS_VARIABLES) {
  const cssVariables = process.env.ALEMONJS_CSS_VARIABLES
  Object.keys(cssVariables).forEach(key => {
    document.documentElement.style.setProperty(`--${key}`, cssVariables[key])
  })
}
