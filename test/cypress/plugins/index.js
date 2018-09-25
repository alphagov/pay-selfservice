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

  // The same fixed user config is used to generate pacts/contracts, so generating cookies from this config
  // ensures our pact-stub server is ready to return canned responses.
  const ssUserConfig = require('../../fixtures/config/self_service_user.json')

  const ssUser = ssUserConfig.config.users.filter(fil => fil.is_primary)[0]

  const encryptedSessionCookieDefaultUser = cookieMonster.getCookie('session', config.env.TEST_SESSION_ENCRYPTION_KEY,
    {
      passport: {user: ssUser.external_id},
      secondFactor: 'totp',
      version: 0,
      icamefrom: 'cypress.io'
    })

  const encryptedGatewayAccountCookieDefaultUser = cookieMonster.getCookie('gateway_account', config.env.TEST_SESSION_ENCRYPTION_KEY,
    {
      currentGatewayAccountId: ssUser.gateway_accounts.filter(fil => fil.isPrimary === 'true')[0].id,
      icamefrom: 'cypress.io'
    })

  config.env.encryptedSessionCookieDefaultUser = encryptedSessionCookieDefaultUser
  config.env.encryptedGatewayAccountCookieDefaultUser = encryptedGatewayAccountCookieDefaultUser

  console.log(`test encrypted session cookie: ${encryptedSessionCookieDefaultUser}`)
  console.log(`test encrypted gateway account cookie: ${encryptedGatewayAccountCookieDefaultUser}`)

  // send back the modified config object
  return config
}
