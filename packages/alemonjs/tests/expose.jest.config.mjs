// 仅用于旧 Expose 契约测试；沿用包的 ESM 编译配置，不改动仓库其他 Jest 套件。
export default {
  rootDir: '../../..',
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/__tests__/packages/alemonjs/expose.test.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true, tsconfig: '<rootDir>/packages/alemonjs/tsconfig.json' }]
  }
};
