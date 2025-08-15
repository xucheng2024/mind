import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        JSX: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      'unused-imports': unusedImports,
    },
    rules: {
      // Check for unused variables - disabled
      'no-unused-vars': 'off',
      
      // Check for unused imports - disabled
      'unused-imports/no-unused-imports': 'off',
      'unused-imports/no-unused-vars': 'off',
      
      // React related rules
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      
      // Other useful rules
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
