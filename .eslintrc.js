module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    'plugin:vue/recommended',
    'plugin:prettier/recommended',
    '@vue/prettier',
    '@vue/typescript'
  ],
  ignorePatterns: ['node_modules/', 'js-common/', 'src/assets/vendor/'],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-extend-native': 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-useless-constructor': 'off',
    '@typescript-eslint/no-useless-constructor': 'error'
  },
  parserOptions: {
    parser: '@typescript-eslint/parser'
  }
}
