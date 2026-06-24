// ESLint flat configuration (ESLint v9+)
// Mirrors the previous .eslintrc.json rule set, ported to the flat config format.

import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // Lint TypeScript sources only; mirror the previous config's "*.js" ignore.
    ignores: ['dist/', 'coverage/', 'node_modules/', '**/*.js'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      // TypeScript handles undefined-symbol and unused-var detection.
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-dupe-class-members': 'off',
    },
  }
);
