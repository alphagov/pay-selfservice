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
  const selfServiceUserConfig = require('../../fixtures/config/self_service_user.json')

  const selfServiceDefaultUser = selfServiceUserConfig.config.users.filter(fil => fil.is_primary)[0]
  const selfServicePlatformAdmin = selfServiceUserConfig.config.users.filter(fil => !fil.is_primary && fil.is_platform_admin)[0]

  // Cookies for the default user
  const encryptedSessionCookieDefaultUser = cookieMonster.getCookie('session', config.env.TEST_SESSION_ENCRYPTION_KEY,
    {
      passport: {user: selfServiceDefaultUser.external_id},
      secondFactor: 'totp',
      version: 0,
      icamefrom: 'Cypress.io (Default user)'
    })

  const encryptedGatewayAccountCookieDefaultUser = cookieMonster.getCookie('gateway_account', config.env.TEST_SESSION_ENCRYPTION_KEY,
    {
      currentGatewayAccountId: selfServiceDefaultUser.gateway_accounts.filter(fil => fil.isPrimary === 'true')[0].id,
      icamefrom: 'Cypress.io (Default user)'
    })

  // Cookies for the platform admin user
  const encryptedSessionCookiePlatformAdmin = cookieMonster.getCookie('session', config.env.TEST_SESSION_ENCRYPTION_KEY,
    {
      passport: {user: selfServicePlatformAdmin.external_id},
      secondFactor: 'totp',
      version: 0,
      icamefrom: 'Cypress.io (Platform admin)'
    })

  const encryptedGatewayAccountCookiePlatformAdmin = cookieMonster.getCookie('gateway_account', config.env.TEST_SESSION_ENCRYPTION_KEY,
    {
      currentGatewayAccountId: '', // No current gateway account
      icamefrom: 'Cypress.io (Platform admin)'
    })

  // Set the environment variables for Cypress
  config.env.encryptedSessionCookieDefaultUser = encryptedSessionCookieDefaultUser
  config.env.encryptedGatewayAccountCookieDefaultUser = encryptedGatewayAccountCookieDefaultUser
  config.env.encryptedSessionCookiePlatformAdmin = encryptedSessionCookiePlatformAdmin
  config.env.encryptedGatewayAccountCookiePlatformAdmin = encryptedGatewayAccountCookiePlatformAdmin

  // send back the modified config object
  return config
}
