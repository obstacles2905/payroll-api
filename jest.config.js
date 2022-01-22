module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['<rootDir>/tests/*.test.js'],
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/*.test.js'],
  testTimeout: 60000,
  moduleFileExtensions: ['js'],
};