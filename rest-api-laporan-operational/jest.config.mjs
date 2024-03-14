/** @type {import('jest').Config} */
const config = {
  collectCoverage: false,
  coverageProvider: "v8",
  transform: {},
  setupFiles: [
    "<rootDir>/helpers/global"
  ]
};

export default config;
