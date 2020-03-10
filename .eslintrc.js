// https://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'script',
  },
  env: {
    node: true,
    es6: true,
    mocha: true,
  },
  extends: 'airbnb-base',
  rules: {
    'strict': ['error', 'global'],
    // 'no-param-reassign': 1,
    'prefer-destructuring': ['error', {
      'AssignmentExpression': {
        array: false,
        object: true,
      },
    }],
    'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],

    'max-len': ['error', 100, 2, {
      ignoreUrls: true,
      ignoreComments: true,
      ignoreRegExpLiterals: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
    }],
  },
  globals: {
    BigInt: 'readonly',
  },
  overrides: [
    {
      files: ['app/models/index.js'],
      rules: {
        'no-param-reassign': 'off',
      },
    },
    {
      files: ['app/entities/**/*.js'],
      rules: {
        'class-methods-use-this': 'off',
      },
    },
    {
      files: ['test/**/*.js'],
      rules: {
        'func-names': 'off',
        'prefer-arrow-callback': 'off',
      },
    },
    {
      files: [
        'app/models/*.js',
        'app/models/*/index.js',
      ],
      rules: {
        'operator-linebreak': ['error', 'before', { overrides: { '=': 'none', '+': 'after' } }],
      },
    },
  ],
};
