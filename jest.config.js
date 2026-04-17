module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/$1',
      '\\.(jpg|jpeg|png|webp|svg)$': '<rootDir>/test/__mocks__/fileMock.js'
    },
    transform: {
      '^.+\\.(js|jsx)$': 'babel-jest'
    },
    testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/']
  }