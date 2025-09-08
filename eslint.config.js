import js from '@eslint/js';
import globals from 'globals';
import ts from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // 忽略不需要检查的文件和目录
  {
    ignores: [
      'frontends/**',
      'clis/**',
      'node_modules/**',
      '**/*.css',
      '**/*.jpg',
      '**/*.png',
      '**/*.yaml',
      '**/*.yml',
      '.tmp/**',
      '*.config.js',
      '*.config.ts',
      '.puppeteerrc.cjs'
    ]
  },

  // TypeScript 声明文件配置 - 放宽注释规则
  {
    files: ['**/*.d.ts'],
    rules: {
      'spaced-comment': 'off'
    }
  },

  // JS 推荐规则
  js.configs.recommended,

  // TS 推荐规则（基础，无需类型信息）
  ...ts.configs.recommended,

  // TS 严格规则（基础，无需类型信息）
  ...ts.configs.strict,

  // Prettier（关闭与 Prettier 冲突的规则）
  prettier,

  // 针对所有 JS 文件的全局配置（可选，根据你需要）
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      }
    }
  },

  // 针对 packages 下所有 TS/TSX 文件，开启类型相关的规则和类型识别
  {
    files: ['packages/*/src/**/*.ts', 'packages/*/src/**/*.tsx'],
    languageOptions: {
      parser: ts.parser,
      parserOptions: {
        // 必须指向每个包自己的 tsconfig.json，确保类型规则生效
        project: ['./packages/*/tsconfig.json'],
        tsconfigRootDir: import.meta.dirname
      },
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      }
    },
    rules: {
      // ===== TypeScript 相关规则 =====
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/require-await': 'error',

      // ===== 代码质量规则 =====
      'prefer-const': ['error', {destructuring: 'all'}],
      'no-empty': ['error', {allowEmptyCatch: true}],
      'no-unused-expressions': 'error',
      'no-console': 'off',
      'no-debugger': 'error',
      'no-alert': 'off',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-useless-call': 'error',
      'no-useless-concat': 'error',
      'no-useless-return': 'error',
      'prefer-promise-reject-errors': 'error',
      'require-await': 'error',
      yoda: 'error',

      // ===== 最佳实践规则 =====
      'eqeqeq': ['error', 'always'],
      curly: ['error', 'all'],
      'no-multi-spaces': 'error',
      'no-trailing-spaces': 'error',
      'eol-last': 'error',
      'no-multiple-empty-lines': ['error', {max: 2, maxEOF: 1}],
      'comma-dangle': ['error', 'never'],
      semi: ['error', 'always'],
      quotes: ['error', 'single', {avoidEscape: true}],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'comma-spacing': ['error', {before: false, after: true}],
      'key-spacing': ['error', {beforeColon: false, afterColon: true}],
      'space-before-blocks': 'error',
      'space-in-parens': ['error', 'never'],
      'space-infix-ops': 'error',
      'keyword-spacing': 'error',
      'arrow-spacing': 'error',
      'block-spacing': 'error',
      'brace-style': ['error', '1tbs', {allowSingleLine: true}],
      camelcase: ['warn', {properties: 'never'}],
      'comma-style': ['error', 'last'],
      'func-call-spacing': ['error', 'never'],
      'function-paren-newline': 'off',
      'implicit-arrow-linebreak': ['error', 'beside'],
      'max-len': ['warn', {code: 160, ignoreUrls: true, ignoreStrings: true}],
      'no-mixed-operators': 'off',
      'no-tabs': 'error',
      'operator-linebreak': ['error', 'before'],
      'padded-blocks': ['error', 'never'],
      'padding-line-between-statements': [
        'error',
        {blankLine: 'always', prev: '*', next: 'return'},
        {blankLine: 'always', prev: ['const', 'let', 'var'], next: '*'},
        {blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var']}
      ],
      'quote-props': ['error', 'as-needed'],
      'space-before-function-paren': 'off',
      'space-unary-ops': 'error',
      'spaced-comment': [
        'error',
        'always',
        {
          line: {
            markers: ['/'],
            exceptions: ['///']
          }
        }
      ],
      'template-tag-spacing': 'error'
    }
  }
];