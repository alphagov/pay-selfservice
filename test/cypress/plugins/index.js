'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const cookieMonster = require('../integration/utils/cookie-monster')
const baseClient = require('../../../app/services/clients/base_client/base_client')
const stubs = require('./stubs')

// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

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
      return baseClient.post({
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
      return baseClient.delete({
        url: mountebankImpostersUrl
      })
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
