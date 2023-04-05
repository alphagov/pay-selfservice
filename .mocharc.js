'use strict'

module.exports = {
  color: true,
  exit: true,
  package: './package.json',
  reporter: 'spec',
  file: ['test/test-helpers/test-env.js', 'test/test-helpers/supress-logs.js'],
  timeout: '10000'
}
