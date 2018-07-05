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

  const ssPrimaryUser = ssUserConfig.config.users.filter(user => user.isPrimary === 'true')[0]

  const ssSecondaryUser = ssUserConfig.config.users[1]

  const encryptedSessionCookieUser1 = cookieMonster.getCookie('session', config.env.TEST_SESSION_ENCRYPTION_KEY,
    {
      passport: { user: ssPrimaryUser.external_id},
      secondFactor: 'totp',
      version: 0,
      icamefrom: 'cypress.io'
    })

  const encryptedGatewayAccountCookieUser1 = cookieMonster.getCookie('gateway_account', config.env.TEST_SESSION_ENCRYPTION_KEY,
    {
      currentGatewayAccountId: ssPrimaryUser.gateway_accounts.filter(fil => fil.isPrimary === 'true')[0].id,
      icamefrom: 'cypress.io'
    })

  const encryptedSessionCookieUser2 = cookieMonster.getCookie('session', config.env.TEST_SESSION_ENCRYPTION_KEY,
    {
      passport: { user: ssSecondaryUser.external_id },
      secondFactor: 'totp',
      version: 0,
      icamefrom: 'cypress.io'
    })

  const encryptedGatewayAccountCookieUser2 = cookieMonster.getCookie('gateway_account', config.env.TEST_SESSION_ENCRYPTION_KEY,
    {
      currentGatewayAccountId: ssSecondaryUser.gateway_accounts.filter(fil => fil.isPrimary === 'true')[0].id,
      icamefrom: 'cypress.io'
    })


  config.env.encryptedSessionCookieUser1 = encryptedSessionCookieUser1
  config.env.encryptedGatewayAccountCookieUser1 = encryptedGatewayAccountCookieUser1

  console.log(`test encrypted session cookie User 1: ${encryptedSessionCookieUser1}`)
  console.log(`test encrypted gateway account cookie User 1: ${encryptedGatewayAccountCookieUser1}`)

  config.env.encryptedSessionCookieUser2 = encryptedSessionCookieUser2
  config.env.encryptedGatewayAccountCookieUser2 = encryptedGatewayAccountCookieUser2

  console.log(`test encrypted session cookie User 2: ${encryptedSessionCookieUser2}`)
  console.log(`test encrypted gateway account cookie User 2: ${encryptedGatewayAccountCookieUser2}`)

  // send back the modified config object
  return config
}
