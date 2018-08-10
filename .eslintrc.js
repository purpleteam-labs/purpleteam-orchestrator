module.exports = {
  'extends': 'airbnb-base',
  rules: {
    'comma-dangle': ['error', 'never'],

    // specify the maximum length of a line in your program
    // http://eslint.org/docs/rules/max-len
    'max-len': ['error', 150, 2, {
      ignoreUrls: true,
      ignoreComments: false,
      ignoreRegExpLiterals: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true
    }],
        // enforce consistent line breaks inside function parentheses
    // https://eslint.org/docs/rules/function-paren-newline
    'function-paren-newline': ['error', 'multiline'],
    //'import/no-unresolved': ['error', {'ignore': ['/home/kim/Source/purpleteam-orchestrator/config']}]
    'import/no-unresolved': [{commonjs: true}]
  },
  env: {
    'node': true
  },
  settings: {
    //eslint-plugin-import is broken: https://github.com/benmosher/eslint-plugin-import/issues/1131
    //'import/resolver': {
    //  'node': {
    //    'paths': ['./config', 'config', './src', 'src'],
    //    'moduleDirectories': ['node_modules', 'config', 'src', './src']
    //  }
    //}
  }    
};
