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
const cookieMonster = require('../integration/utils/cookie-monster')
const stubs = require('./stubs')

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)
module.exports = (on, config) => {
  const mountebankImpostersUrl = config.env.MOUNTEBANK_URL + '/imposters'

  on('task', {
    getCookies (opts) {
      const encryptedSessionCookie = generateEncryptedSessionCookie(
        config.env.TEST_SESSION_ENCRYPTION_KEY,
        opts.user_external_id
      )
      const encryptedGatewayAccountCookie = generateEncryptedGatewayAccountCookie(
        config.env.TEST_SESSION_ENCRYPTION_KEY,
        opts.gateway_account_id
      )

      return { encryptedSessionCookie, encryptedGatewayAccountCookie }
    },
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
    clearStubs () {
      return request.delete(mountebankImpostersUrl)
    }
  })

  // send back the modified config object
  return config
}

function generateEncryptedSessionCookie (sessionEncyptionKey, userExternalId) {
  const encryptedSessionCookie = cookieMonster.getCookie('session', sessionEncyptionKey,
    {
      passport: { user: userExternalId },
      secondFactor: 'totp',
      version: 0,
      icamefrom: 'cypress.io'
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
