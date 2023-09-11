const { defineConfig } = require('cypress')

module.exports = defineConfig({
  viewportHeight: 800,
  viewportWidth: 1280,
  env: {
    TEST_SESSION_ENCRYPTION_KEY:
      'naskjwefvwei72rjkwfmjwfi72rfkjwefmjwefiuwefjkbwfiu24fmjbwfk',
    MOUNTEBANK_URL: 'http://127.0.0.1:2525',
    MOUNTEBANK_IMPOSTERS_PORT: 8000
  },
  fileServerFolder: './test/cypress',
  screenshotsFolder: './test/cypress/screenshots',
  videosFolder: './test/cypress/videos',
  video: false,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents (on, config) {
      return require('./test/cypress/plugins')(on, config)
    },
    baseUrl: 'http://127.0.0.1:3000',
    specPattern: './test/cypress/integration/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: './test/cypress/support'
  }
})
