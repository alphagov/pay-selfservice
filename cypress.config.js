const { defineConfig } = require('cypress')
const path = require('path')

const packageJson = require('./package.json')
const aliases = packageJson._moduleAliases || {}

const webpackAliases = Object.entries(aliases).reduce((acc, [key, value]) => {
  acc[key] = path.resolve(__dirname, value)
  return acc
}, {})

module.exports = defineConfig({
  viewportHeight: 1200,
  viewportWidth: 1280,
  env: {
    TEST_SESSION_ENCRYPTION_KEY:
      'naskjwefvwei72rjkwfmjwfi72rfkjwefmjwefiuwefjkbwfiu24fmjbwfk',
    MOCK_HTTP_SERVER_URL: 'http://127.0.0.1:8000',
    MOCK_HTTP_SERVER_PORT: 8000
  },
  fileServerFolder: './test/cypress',
  screenshotsFolder: './test/cypress/screenshots',
  videosFolder: './test/cypress/videos',
  video: false,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents (on, config) {
      on('file:preprocessor', require('@cypress/webpack-preprocessor')({
        webpackOptions: {
          resolve: {
            alias: webpackAliases
          }
        }
      }))
      return require('./test/cypress/plugins')(on, config)
    },
    baseUrl: 'http://127.0.0.1:3000',
    specPattern: './test/cypress/integration/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: './test/cypress/support'
  }
})
