module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(png|jpg|jpeg|gif|webp|svg)$': '<rootDir>/src/test/fileMock.js',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
};
