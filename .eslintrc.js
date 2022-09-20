module.exports = {
  root: true,
  extends: ['airbnb-base', 'plugin:react/recommended'],
  env: {
    browser: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    allowImportExportEverywhere: true,
    sourceType: 'module',
    requireConfigFile: false,
  },
  rules: {
    // allow reassigning param
    'no-param-reassign': [2, { props: false }],
    'linebreak-style': ['error', 'unix'],
    'import/extensions': ['error', {
      js: 'always',
    }],
    'react/react-in-jsx-scope': 0,
    'react/jsx-key': [2, { checkFragmentShorthand: true }],
    'react/prop-types': 0,
    'import/no-unresolved': 0,
  },
  settings: {
    react: {
      // eslint-plugin-preact interprets this as "h.createElement",
      // however we only care about marking h() as being a used variable.
      pragma: 'h',
      // We use "react 16.0" to avoid pushing folks to UNSAFE_ methods.
      version: '16.0',
    },
  },
};
