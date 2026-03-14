const js = require('@eslint/js');
const { FlatCompat } = require('@eslint/eslintrc');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

module.exports = [
  {
    ignores: ['node_modules/', 'dist/', 'build/', 'server/uploads/'],
  },
  ...compat.config({
    root: true,
    env: {
      es2022: true,
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    plugins: ['@typescript-eslint', 'react', 'react-hooks', 'jsx-a11y', 'import'],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:react/recommended',
      'plugin:react-hooks/recommended',
      'plugin:jsx-a11y/recommended',
      'plugin:import/recommended',
      'plugin:import/typescript',
      'prettier',
    ],
    overrides: [
      {
        files: ['client/**/*.{ts,tsx}'],
        env: {
          browser: true,
        },
        rules: {
          'react/react-in-jsx-scope': 'off',
          'react/prop-types': 'off',
          'import/no-unresolved': 'off',
          'jsx-a11y/heading-has-content': 'off',
          'jsx-a11y/label-has-associated-control': 'off',
        },
      },
      {
        files: ['server/**/*.ts'],
        env: {
          node: true,
        },
      },
    ],
  }),
];
