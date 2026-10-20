import globals from 'globals';

export default [
  { ignores: ['dist/**', 'node_modules/**', '.tools/**'] },
  {
    files: ['*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: globals.browser },
    rules: {
      'no-debugger': 'error',
      'no-dupe-args': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-unreachable': 'error',
      'valid-typeof': 'error',
      'constructor-super': 'error',
    },
  },
  {
    files: ['scripts/*.cjs', 'tests/*.cjs'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs', globals: globals.node },
    rules: { 'no-debugger': 'error', 'no-dupe-keys': 'error', 'no-unreachable': 'error', 'valid-typeof': 'error' },
  },
];
