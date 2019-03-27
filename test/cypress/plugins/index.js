// ***********************************************************
// This file is used to load plugins.
//
// You can read more about Cypress plugins here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

'use strict'

// NPM dependencies
const lodash = require('lodash')
const request = require('request-promise-native')

// Local dependencies
const cookieMonster = require('./cookie-monster')
const stubs = require('./stubs')

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)
module.exports = (on, config) => {
  const mountebankImpostersUrl = config.env.MOUNTEBANK_URL + '/imposters'

  on('task', {
    getCookies (opts) {
      const encryptedSessionCookie = generateEncryptedSessionCookie(
        config.env.TEST_SESSION_ENCRYPTION_KEY,
        opts.user_external_id,
        opts.pageData
      )
      const encryptedGatewayAccountCookie = generateEncryptedGatewayAccountCookie(
        config.env.TEST_SESSION_ENCRYPTION_KEY,
        opts.gateway_account_id
      )

      return { encryptedSessionCookie, encryptedGatewayAccountCookie }
    },
    /**
     * Makes a post request to Mountebank to setup an Imposter with stubs built using the array of stub specifications
     * provided.
     *
     * Note: this task can only be called once per test, so all stubs for a test must be set up in the same call.
     *
     * @param stubSpecs - an array of stub specification objects, each having a `name` and `opts`. The name refers to
     * the name of a function defined in plugins/stubs.js, and the opts is an object passed to this function providing
     * the configuration options for building the stub predicates and responses.
     */
    setupStubs (stubSpecs) {
      const stubsArray = lodash.flatMap(stubSpecs, spec => stubs[spec.name](spec.opts))
      return request({
        method: 'POST',
        url: mountebankImpostersUrl,
        json: true,
        body: {
          port: config.env.MOUNTEBANK_IMPOSTERS_PORT,
          protocol: 'http',
          stubs: stubsArray
        }
      })
    },
    /**
     * Makes a request to Mountebank to delete the existing Imposter along with all stubs that have been set up.
     */
    clearStubs () {
      return request.delete(mountebankImpostersUrl)
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

function generateEncryptedGatewayAccountCookie (sessionEncyptionKey, gatewayAccountId) {
  const encryptedGatewayAccountCookie = cookieMonster.getCookie('gateway_account', sessionEncyptionKey,
    {
      currentGatewayAccountId: gatewayAccountId,
      icamefrom: 'cypress.io'
    })
  return encryptedGatewayAccountCookie
}
