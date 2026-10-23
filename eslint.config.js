import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    eslintConfigPrettier,
    {
        files: ['**/*.{js,mjs,cjs,ts}'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        rules: {
            'prefer-const': ['error', { ignoreReadBeforeAssign: true }],
            'no-alert': 'error',
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'no-await-in-loop': 'error',
            'no-eval': 'error',
        },
    },
];
