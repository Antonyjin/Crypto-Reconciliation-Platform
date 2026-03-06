export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@app/shared$': '<rootDir>/../../packages/shared/src',
  },
};
