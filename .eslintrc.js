module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
      project: 'tsconfig.json',
      tsconfigRootDir: __dirname,
      sourceType: 'module',
  },
  plugins: [
      '@typescript-eslint/eslint-plugin',
      'simple-import-sort',
      'unused-imports',
  ],
  extends: [
      'plugin:@typescript-eslint/recommended',
      'plugin:prettier/recommended',
  ],
  root: true,
  env: {
      node: true,
      jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist/*'],
  rules: {
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/explicit-function-return-type': [
      'warn',
      { allowExpressions: true },
      ],
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/indent': 'off',
      '@typescript-eslint/no-angle-bracket-type-assertion': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-parameter-properties': 'off',
      '@typescript-eslint/prefer-interface': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'unused-imports/no-unused-imports': 'error',
  },
  overrides: [
      {
      files: ['*.test.ts'],
      rules: {
          '@typescript-eslint/explicit-function-return-type': 'off',
          '@typescript-eslint/strict-boolean-expressions': 'off',
          '@typescript-eslint/no-empty-function': 'off',
          '@typescript-eslint/interface-name-prefix': 'off',
      },
      },
  ],
};


