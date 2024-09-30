/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: "./jest.env.ts",
  transform: {
    "^.+.tsx?$": ["ts-jest", {}],
  },
  setupFiles: ["jest-canvas-mock"],
};
