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
      '@typescript-eslint/ban-ts-comment': 'off', // enabled silencing of ts warnings for js/mjs files
    },
  },
  {
    files: ['**/*.test.js'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  }
)
