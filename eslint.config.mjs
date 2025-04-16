import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettierConfig from 'eslint-config-prettier'
import globals from 'globals'

export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/dist/**'],
  },
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  prettierConfig,
  {
    rules: {
      '@typescript-eslint/no-deprecated': 'warn',
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.mocha,
        ...globals.chai,
        cy: 'readonly',
        Cypress: 'readonly',
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      '@typescript-eslint/no-require-imports': 'off', // enable use of 'require' for js files
      '@typescript-eslint/ban-ts-comment': 'off', // enabled silencing of ts no-check warnings for js/mjs files
      '@typescript-eslint/no-unused-vars': 'off', // TODO temporary switch off for js files only [standard -> eslint migration]
      '@typescript-eslint/no-empty-function': 'off', // TODO temporary switch off for js files only [standard -> eslint migration]
      '@typescript-eslint/prefer-for-of': 'off', // TODO temporary switch off for js files only [standard -> eslint migration]
      '@typescript-eslint/no-unused-expressions': 'off', // TODO temporary switch off for js files only [standard -> eslint migration]
      'no-constant-binary-expression': 'off', // TODO temporary switch off for js files only [standard -> eslint migration]
    },
  },
  {
    files: ['**/*.test.js'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  }
)
