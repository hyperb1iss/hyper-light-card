module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.js$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.css$': '<rootDir>/__mocks__/styleMock.js',  // Mock CSS imports
    '^@/(.*)$': '<rootDir>/src/$1',  // Map @/ to src/ directory
  },
  transformIgnorePatterns: [
    '/node_modules/(?!lit|@lit|lit-html|lit-element)/',
  ],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  moduleDirectories: ['node_modules', 'src'],
};