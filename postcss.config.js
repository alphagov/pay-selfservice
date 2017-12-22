const path = require('path')

module.exports = ({ file, options, env }) => ({
  'syntax': 'postcss-scss',
  plugins: {
    'postcss-import': {},
    'postcss-cssnext': {},
    'cssnano': {}
  }
})
