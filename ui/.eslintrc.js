module.exports = {
  env: {
    browser: true,
    es6: true
  },
  extends: [
    'standard-with-typescript',
    'plugin:vue/recommended',
    '@vue/typescript'
  ],
  parserOptions: {
    parser: '@typescript-eslint/parser',
    project: './tsconfig.json'
  },
  rules: {
    'max-len': ['error', 120, 4, { ignoreUrls: true }],
    '@typescript-eslint/ban-types': ['error', {
      types: {
        // By default type `object` is banned because of https://github.com/microsoft/TypeScript/issues/21732.
        // This issue is not really effecting us and we use `object` heavily, therefore `object` is allowed.
        object: false
      }
    }],
    '@typescript-eslint/restrict-template-expressions': ['error', {
      allowNumber: true, allowAny: true, allowBoolean: true
    }]
  }
}
