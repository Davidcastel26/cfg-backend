/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  clearMocks: true,
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        // Force CommonJS for the test transform — sidesteps node16/ESM quirks
        // in ts-jest while the app itself still builds with module: node16.
        tsconfig: { module: 'commonjs', verbatimModuleSyntax: false, isolatedModules: true },
      },
    ],
  },
};
