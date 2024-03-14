module.exports = {
  env: {
    browser: false,
    es2021: true,
    node: true
  },
  extends: 'airbnb-base',
  overrides: [
    {
      env: {
        node: true,
      },
      files: [
        '.eslintrc.{js,cjs}',
      ],
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],
  globals: {
    mySendResponse: 'readonly',
    mySendErrorResponse: 'readonly',
    myDumpErr: 'readonly',
    myDumpExit: 'readonly',
    logger: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  ignorePatterns: ['**/tests/**', "node_modules/"],
  rules: {
    'import/extensions': ['error', 'ignorePackages', {
      js: 'always',
      mjs: 'always',
      jsx: 'always',
    }],
    'no-console': 'off',
    'no-underscore-dangle': ["error", { "allow": ["_id"] }],
    'camelcase': ["off"],
    'no-continue': ["off"],
    'no-await-in-loop': ["off"]
  },
};
