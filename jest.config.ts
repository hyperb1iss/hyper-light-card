module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|js)$': '@swc/jest',
  },
  moduleNameMapper: {
    '\\.css$': '<rootDir>/__mocks__/styleMock.js', // Mock CSS imports
    '^@/(.*)$': '<rootDir>/src/$1', // Map @/ to src/ directory
    '^colorthief$': '<rootDir>/__mocks__/colorthief.js',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(lit|@lit|lit-html|lit-element|custom-card-helpers)/)',
  ],
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
};
