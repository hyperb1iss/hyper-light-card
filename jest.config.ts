module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.js$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.css$': '<rootDir>/__mocks__/styleMock.js',  // Mock CSS imports
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
};
