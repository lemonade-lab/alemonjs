/**
 * feat：新增功能（feature）。表示添加了新的功能或功能的扩展。
 * fix：修复问题（bug fix）。表示修复了已存在的问题或错误。
 * docs：文档更新。表示更新了文档，如添加新的文档、改进现有文档等。
 * chore：杂项任务（chore）。表示对构建过程或辅助工具的修改，不涉及功能或代码的更改。
 * style：代码风格调整。表示对代码风格、格式的调整，如空格、缩进、命名等。
 * refactor：重构代码。表示对代码进行重构，旨在改进代码结构、性能或可读性，但不涉及功能更改。
 * test：测试相关。表示新增或修改了测试代码，如添加新的测试用例、修复现有测试等。
 * revert：撤销提交。表示撤销先前的提交，用于还原之前的更改。
 */
// git commit -m "feat: Add new feature"
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 提交类型（type）必须使用小写字母
    'type-case': [2, 'always', 'lower-case'],
    // 提交类型（type）必须符合指定的正则表达式
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'chore', 'style', 'refactor', 'test', 'revert']
    ],
    // 提交范围（scope）必须使用小写字母
    'scope-case': [2, 'always', 'lower-case'],
    // 提交主题（subject）的长度限制为 50 个字符
    'subject-max-length': [2, 'always', 50],
    // 提交主题（subject）的首字母必须大写
    'subject-case': [2, 'always', 'sentence-case'],
    // 提交主题（subject）不允许以句号结尾
    'subject-full-stop': [2, 'never', '.']
    // 提交主题（subject）必须使用具体、清晰的语句描述更改内容
    // 'subject-words': [
    //   2,
    //   'always',
    //   {
    //     words: ['add', 'update', 'remove', 'refactor', 'fix', 'merge', 'docs']
    //   }
    // ]
  }
}
