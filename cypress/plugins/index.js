const cookieMonster = require('../integration/utils/cookie-monster')

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
  console.log('Generating encrypted cookies for session and gateway_account...')

  // NOTE : externalId (7d19aff33f8948deb97ed16b2912dcd3) comes from self-service -> adminservice pact/contract as a given user id that returns stub data
  const encryptedSessionCookie = cookieMonster.getCookie('session', config.env.TEST_SESSION_ENCRYPTION_KEY,
    {
      passport: {user: '7d19aff33f8948deb97ed16b2912dcd3'},
      secondFactor: 'totp',
      version: 0,
      icamefrom: 'cypress.io'
    })

  const encryptedGatewayAccountCookie = cookieMonster.getCookie('gateway_account', config.env.TEST_SESSION_ENCRYPTION_KEY,
    {
      currentGatewayAccountId: "666",
      icamefrom: 'cypress.io'
    })

  config.env.encryptedSessionCookie = encryptedSessionCookie
  config.env.encryptedGatewayAccountCookie = encryptedGatewayAccountCookie

  console.log(`test encrypted session cookie: ${encryptedSessionCookie}`)
  console.log(`test encrypted gateway account cookie: ${encryptedSessionCookie}`)
  // send back the modified config object
  return config
}
