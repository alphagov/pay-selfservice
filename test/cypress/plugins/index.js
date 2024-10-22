// ***********************************************************
// This file is used to load plugins.
//
// You can read more about Cypress plugins here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

'use strict'

const axios = require('axios')

const cookieMonster = require('./cookie-monster')

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)
module.exports = (on, config) => {
  const stubSetupUrl = config.env.MOCK_HTTP_SERVER_URL + '/__add-mock-endpoints__'
  const stubResetUrl = config.env.MOCK_HTTP_SERVER_URL + '/__clear-mock-endpoints__'

  on('task', {
    getCookies (opts) {
      const encryptedSessionCookie = generateEncryptedSessionCookie(
        config.env.TEST_SESSION_ENCRYPTION_KEY,
        opts.user_external_id,
        opts.pageData
      )
      return { encryptedSessionCookie }
    },
    /**
     * Makes a post request to @govuk-pay/run-amock to setup stubs built using the array of stubs
     *
     * Note: this task can only be called once per test, so all stubs for a test must be set up in
     * the same call.
     */
    setupStubs (stubs) {
      return axios.post(stubSetupUrl,
        {
          port: config.env.MOCK_HTTP_SERVER_PORT,
          protocol: 'http',
          defaultResponse: {
            statusCode: 404,
            body: 'No stub predicate matches the request',
            headers: {}
          },
          stubs
        })
        .then(function () { return '' })
        .catch(function (error) {
          throw error
        })
    },
    /**
     * Makes a request to @govuk-pay/run-amock to delete the existing mocks along with all stubs that have been set up.
     */
    clearStubs () {
      return axios.post(stubResetUrl)
        .then(function () { return '' })
        .catch(function (error) {
          throw error
        })
    }
  })

  // send back the modified config object
  return config
}

function generateEncryptedSessionCookie (sessionEncyptionKey, userExternalId, pageData = {}) {
  const encryptedSessionCookie = cookieMonster.getCookie('session', sessionEncyptionKey,
    {
      passport: { user: userExternalId },
      secondFactor: 'totp',
      version: 0,
      icamefrom: 'cypress.io',
      pageData
    })
  return encryptedSessionCookie
}
