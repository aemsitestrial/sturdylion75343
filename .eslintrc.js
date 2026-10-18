module.exports = {
  root: true,
  extends: [
    'airbnb-base',
    'plugin:json/recommended',
    'plugin:xwalk/recommended',
  ],
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
    'import/extensions': ['error', { js: 'always' }], // require js file extensions in imports
    'linebreak-style': ['error', 'unix'], // enforce unix linebreaks
    'no-param-reassign': [2, { props: false }], // allow modifying properties of param
  },
  {
    files: ['component-models.json'],
    rules: {
      'xwalk/invalid-field-name': 'off', // Allow standard meta tag names like twitter:image:alt and og:image:alt
      'xwalk/max-cells': [
        'error',
        {
          section: 30, // section is a key-value block and over 4 is OK
          listing: 5,
        },
      ],
    },
  },
};
