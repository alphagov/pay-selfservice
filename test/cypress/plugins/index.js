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

  // Get our fixture data which is used to generate contract/pact data from
  // const gatewayAccountResponseDefaultFixture = require('../../fixtures/gateway_account_fixtures').validGatewayAccountResponse().getPlain()
  // const userResponseDefaultFixture = require('../../fixtures/user_fixtures').validUserResponse().getPlain()

  const ssUserConfig = require('../../fixtures/config/self_service_user.json')

  // Use a known configuration as a basis for our user/gateway cookie.
  // These match contacts/pacts and ensure that the pact-stub, stub container can match requests/responses

  const ssUser = ssUserConfig.config.users.filter(fil => fil.isPrimary === 'true')[0]

  const encryptedSessionCookie = cookieMonster.getCookie('session', config.env.TEST_SESSION_ENCRYPTION_KEY,
    {
      passport: {user: ssUser.external_id},
      secondFactor: 'totp',
      version: 0,
      icamefrom: 'cypress.io'
    })

  const encryptedGatewayAccountCookie = cookieMonster.getCookie('gateway_account', config.env.TEST_SESSION_ENCRYPTION_KEY,
    {
      currentGatewayAccountId: ssUser.gateway_accounts.filter(fil => fil.isPrimary === 'true')[0].id,
      icamefrom: 'cypress.io'
    })

  config.env.encryptedSessionCookie = encryptedSessionCookie
  config.env.encryptedGatewayAccountCookie = encryptedGatewayAccountCookie

  console.log(`test encrypted session cookie: ${encryptedSessionCookie}`)
  console.log(`test encrypted gateway account cookie: ${encryptedSessionCookie}`)

  // send back the modified config object
  return config
}
