import js from '@eslint/js';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
    js.configs.recommended,
    eslintConfigPrettier,
    {
        files: ['**/*.{js,mjs,cjs}'],
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
