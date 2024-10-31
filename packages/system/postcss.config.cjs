module.exports = {
  plugins: {
    // 允许使用import导入css文件
    'postcss-import': {},
    // 允许使用嵌套语法
    'postcss-simple-vars': {},
    // nested
    'postcss-nested': {},
    // tailwindcss
    'tailwindcss': {},
    // 增加浏览器前缀
    'autoprefixer': {},
    // 内联url资源
    'postcss-url': {
      url: 'inline'
    }
  }
}
