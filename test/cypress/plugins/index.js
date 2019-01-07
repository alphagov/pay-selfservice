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

  // Default user
  const selfServiceUser = selfServiceUserConfig.config.users.find(fil => fil.isPrimary === 'true')
  const encryptedSessionCookie = generateEncryptedSessionCookie(
    config.env.TEST_SESSION_ENCRYPTION_KEY,
    selfServiceUser.external_id
  )
  const encryptedGatewayAccountCookie = generateEncryptedGatewayAccountCookie(
    config.env.TEST_SESSION_ENCRYPTION_KEY,
    selfServiceUser.gateway_accounts.find(fil => fil.isPrimary === 'true').id
  )
  config.env.encryptedSessionCookie = encryptedSessionCookie
  config.env.encryptedGatewayAccountCookie = encryptedGatewayAccountCookie

  // REQUEST_TO_GO_LIVE_NO_PERMISSIONS user
  const selfServiceRequestToGoLiveNoPermissionsUser = selfServiceUserConfig.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_NO_PERMISSIONS')
  const encryptedSessionRequestToGoLiveNoPermissionsCookie = generateEncryptedSessionCookie(
    config.env.TEST_SESSION_ENCRYPTION_KEY,
    selfServiceRequestToGoLiveNoPermissionsUser.external_id
  )
  const encryptedGatewayAccountRequestToGoLiveNoPermissionsCookie = generateEncryptedGatewayAccountCookie(
    config.env.TEST_SESSION_ENCRYPTION_KEY,
    selfServiceRequestToGoLiveNoPermissionsUser.gateway_accounts.find(fil => fil.isPrimary === 'true').id
  )
  config.env.encryptedSessionRequestToGoLiveNoPermissionsCookie = encryptedSessionRequestToGoLiveNoPermissionsCookie
  config.env.encryptedGatewayAccountRequestToGoLiveNoPermissionsCookie = encryptedGatewayAccountRequestToGoLiveNoPermissionsCookie

  // REQUEST_TO_GO_LIVE_STAGE_NOT_STARTED user
  const selfServiceRequestToGoLiveStageNotStartedUser = selfServiceUserConfig.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_STAGE_NOT_STARTED')
  const encryptedSessionRequestToGoLiveStageNotStartedCookie = generateEncryptedSessionCookie(
    config.env.TEST_SESSION_ENCRYPTION_KEY,
    selfServiceRequestToGoLiveStageNotStartedUser.external_id
  )
  const encryptedGatewayAccountRequestToGoLiveStageNotStartedCookie = generateEncryptedGatewayAccountCookie(
    config.env.TEST_SESSION_ENCRYPTION_KEY,
    selfServiceRequestToGoLiveStageNotStartedUser.gateway_accounts.find(fil => fil.isPrimary === 'true').id
  )
  config.env.encryptedSessionRequestToGoLiveStageNotStartedCookie = encryptedSessionRequestToGoLiveStageNotStartedCookie
  config.env.encryptedGatewayAccountRequestToGoLiveStageNotStartedCookie = encryptedGatewayAccountRequestToGoLiveStageNotStartedCookie

  // REQUEST_TO_GO_LIVE_STAGE_ENTERED_ORGANISATION_NAME user
  const selfServiceRequestToGoLiveStageEnteredOrganisationNameUser = selfServiceUserConfig.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_STAGE_ENTERED_ORGANISATION_NAME')
  const encryptedSessionRequestToGoLiveStageEnteredOrganisationNameCookie = generateEncryptedSessionCookie(
    config.env.TEST_SESSION_ENCRYPTION_KEY,
    selfServiceRequestToGoLiveStageEnteredOrganisationNameUser.external_id
  )
  const encryptedGatewayAccountRequestToGoLiveStageEnteredOrganisationNameCookie = generateEncryptedGatewayAccountCookie(
    config.env.TEST_SESSION_ENCRYPTION_KEY,
    selfServiceRequestToGoLiveStageEnteredOrganisationNameUser.gateway_accounts.find(fil => fil.isPrimary === 'true').id
  )
  config.env.encryptedSessionRequestToGoLiveStageEnteredOrganisationNameCookie = encryptedSessionRequestToGoLiveStageEnteredOrganisationNameCookie
  config.env.encryptedGatewayAccountRequestToGoLiveStageEnteredOrganisationNameCookie = encryptedGatewayAccountRequestToGoLiveStageEnteredOrganisationNameCookie

  // REQUEST_TO_GO_LIVE_STAGE_CHOSEN_PSP_STRIPE user
  const selfServiceRequestToGoLiveStageChosenPspStripeUser = selfServiceUserConfig.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_STAGE_CHOSEN_PSP_STRIPE')
  const encryptedSessionRequestToGoLiveStageChosenPspStripeCookie = generateEncryptedSessionCookie(
    config.env.TEST_SESSION_ENCRYPTION_KEY,
    selfServiceRequestToGoLiveStageChosenPspStripeUser.external_id
  )
  const encryptedGatewayAccountRequestToGoLiveStageChosenPspStripeCookie = generateEncryptedGatewayAccountCookie(
    config.env.TEST_SESSION_ENCRYPTION_KEY,
    selfServiceRequestToGoLiveStageChosenPspStripeUser.gateway_accounts.find(fil => fil.isPrimary === 'true').id
  )
  config.env.encryptedSessionRequestToGoLiveStageChosenPspStripeCookie = encryptedSessionRequestToGoLiveStageChosenPspStripeCookie
  config.env.encryptedGatewayAccountRequestToGoLiveStageChosenPspStripeCookie = encryptedGatewayAccountRequestToGoLiveStageChosenPspStripeCookie

  // REQUEST_TO_GO_LIVE_STAGE_CHOSEN_PSP_WORLDPAY user
  const selfServiceRequestToGoLiveStageChosenPspWorldPayUser = selfServiceUserConfig.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_STAGE_CHOSEN_PSP_WORLDPAY')
  const encryptedSessionRequestToGoLiveStageChosenPspWorldPayCookie = generateEncryptedSessionCookie(
    config.env.TEST_SESSION_ENCRYPTION_KEY,
    selfServiceRequestToGoLiveStageChosenPspWorldPayUser.external_id
  )
  const encryptedGatewayAccountRequestToGoLiveStageChosenPspWorldPayCookie = generateEncryptedGatewayAccountCookie(
    config.env.TEST_SESSION_ENCRYPTION_KEY,
    selfServiceRequestToGoLiveStageChosenPspWorldPayUser.gateway_accounts.find(fil => fil.isPrimary === 'true').id
  )
  config.env.encryptedSessionRequestToGoLiveStageChosenPspWorldPayCookie = encryptedSessionRequestToGoLiveStageChosenPspWorldPayCookie
  config.env.encryptedGatewayAccountRequestToGoLiveStageChosenPspWorldPayCookie = encryptedGatewayAccountRequestToGoLiveStageChosenPspWorldPayCookie

  // REQUEST_TO_GO_LIVE_STAGE_CHOSEN_PSP_SMARTPAY user
  const selfServiceRequestToGoLiveStageChosenPspSmartPayUser = selfServiceUserConfig.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_STAGE_CHOSEN_PSP_SMARTPAY')
  const encryptedSessionRequestToGoLiveStageChosenPspSmartPayCookie = generateEncryptedSessionCookie(
    config.env.TEST_SESSION_ENCRYPTION_KEY,
    selfServiceRequestToGoLiveStageChosenPspSmartPayUser.external_id
  )
  const encryptedGatewayAccountRequestToGoLiveStageChosenPspSmartPayCookie = generateEncryptedGatewayAccountCookie(
    config.env.TEST_SESSION_ENCRYPTION_KEY,
    selfServiceRequestToGoLiveStageChosenPspSmartPayUser.gateway_accounts.find(fil => fil.isPrimary === 'true').id
  )
  config.env.encryptedSessionRequestToGoLiveStageChosenPspSmartPayCookie = encryptedSessionRequestToGoLiveStageChosenPspSmartPayCookie
  config.env.encryptedGatewayAccountRequestToGoLiveStageChosenPspSmartPayCookie = encryptedGatewayAccountRequestToGoLiveStageChosenPspSmartPayCookie

  // REQUEST_TO_GO_LIVE_STAGE_CHOSEN_PSP_EPDQ user
  const selfServiceRequestToGoLiveStageChosenPspEpdqUser = selfServiceUserConfig.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_STAGE_CHOSEN_PSP_EPDQ')
  const encryptedSessionRequestToGoLiveStageChosenPspEpdqCookie = generateEncryptedSessionCookie(
    config.env.TEST_SESSION_ENCRYPTION_KEY,
    selfServiceRequestToGoLiveStageChosenPspEpdqUser.external_id
  )
  const encryptedGatewayAccountRequestToGoLiveStageChosenPspEpdqCookie = generateEncryptedGatewayAccountCookie(
    config.env.TEST_SESSION_ENCRYPTION_KEY,
    selfServiceRequestToGoLiveStageChosenPspEpdqUser.gateway_accounts.find(fil => fil.isPrimary === 'true').id
  )
  config.env.encryptedSessionRequestToGoLiveStageChosenPspEpdqCookie = encryptedSessionRequestToGoLiveStageChosenPspEpdqCookie
  config.env.encryptedGatewayAccountRequestToGoLiveStageChosenPspEpdqCookie = encryptedGatewayAccountRequestToGoLiveStageChosenPspEpdqCookie

  // REQUEST_TO_GO_LIVE_STAGE_TERMS_AGREED_STRIPE user
  const selfServiceRequestToGoLiveStageTermsAgreedStripeUser = selfServiceUserConfig.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_STAGE_TERMS_AGREED_STRIPE')
  const encryptedSessionRequestToGoLiveStageTermsAgreedStripeCookie = generateEncryptedSessionCookie(
    config.env.TEST_SESSION_ENCRYPTION_KEY,
    selfServiceRequestToGoLiveStageTermsAgreedStripeUser.external_id
  )
  const encryptedGatewayAccountRequestToGoLiveStageTermsAgreedStripeCookie = generateEncryptedGatewayAccountCookie(
    config.env.TEST_SESSION_ENCRYPTION_KEY,
    selfServiceRequestToGoLiveStageTermsAgreedStripeUser.gateway_accounts.find(fil => fil.isPrimary === 'true').id
  )
  config.env.encryptedSessionRequestToGoLiveStageTermsAgreedStripeCookie = encryptedSessionRequestToGoLiveStageTermsAgreedStripeCookie
  config.env.encryptedGatewayAccountRequestToGoLiveStageTermsAgreedStripeCookie = encryptedGatewayAccountRequestToGoLiveStageTermsAgreedStripeCookie

  // REQUEST_TO_GO_LIVE_STAGE_TERMS_AGREED_WORLDPAY user
  const selfServiceRequestToGoLiveStageTermsAgreedWorldPayUser = selfServiceUserConfig.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_STAGE_TERMS_AGREED_WORLDPAY')
  const encryptedSessionRequestToGoLiveStageTermsAgreedWorldPayCookie = generateEncryptedSessionCookie(
    config.env.TEST_SESSION_ENCRYPTION_KEY,
    selfServiceRequestToGoLiveStageTermsAgreedWorldPayUser.external_id
  )
  const encryptedGatewayAccountRequestToGoLiveStageTermsAgreedWorldPayCookie = generateEncryptedGatewayAccountCookie(
    config.env.TEST_SESSION_ENCRYPTION_KEY,
    selfServiceRequestToGoLiveStageTermsAgreedWorldPayUser.gateway_accounts.find(fil => fil.isPrimary === 'true').id
  )
  config.env.encryptedSessionRequestToGoLiveStageTermsAgreedWorldPayCookie = encryptedSessionRequestToGoLiveStageTermsAgreedWorldPayCookie
  config.env.encryptedGatewayAccountRequestToGoLiveStageTermsAgreedWorldPayCookie = encryptedGatewayAccountRequestToGoLiveStageTermsAgreedWorldPayCookie

  // REQUEST_TO_GO_LIVE_STAGE_TERMS_AGREED_SMARTPAY user
  const selfServiceRequestToGoLiveStageTermsAgreedSmartPayUser = selfServiceUserConfig.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_STAGE_TERMS_AGREED_SMARTPAY')
  const encryptedSessionRequestToGoLiveStageTermsAgreedSmartPayCookie = generateEncryptedSessionCookie(
    config.env.TEST_SESSION_ENCRYPTION_KEY,
    selfServiceRequestToGoLiveStageTermsAgreedSmartPayUser.external_id
  )
  const encryptedGatewayAccountRequestToGoLiveStageTermsAgreedSmartPayCookie = generateEncryptedGatewayAccountCookie(
    config.env.TEST_SESSION_ENCRYPTION_KEY,
    selfServiceRequestToGoLiveStageTermsAgreedSmartPayUser.gateway_accounts.find(fil => fil.isPrimary === 'true').id
  )
  config.env.encryptedSessionRequestToGoLiveStageTermsAgreedSmartPayCookie = encryptedSessionRequestToGoLiveStageTermsAgreedSmartPayCookie
  config.env.encryptedGatewayAccountRequestToGoLiveStageTermsAgreedSmartPayCookie = encryptedGatewayAccountRequestToGoLiveStageTermsAgreedSmartPayCookie

  // REQUEST_TO_GO_LIVE_STAGE_TERMS_AGREED_EPDQ user
  const selfServiceRequestToGoLiveStageTermsAgreedEpdqUser = selfServiceUserConfig.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_STAGE_TERMS_AGREED_EPDQ')
  const encryptedSessionRequestToGoLiveStageTermsAgreedEpdqCookie = generateEncryptedSessionCookie(
    config.env.TEST_SESSION_ENCRYPTION_KEY,
    selfServiceRequestToGoLiveStageTermsAgreedEpdqUser.external_id
  )
  const encryptedGatewayAccountRequestToGoLiveStageTermsAgreedEpdqCookie = generateEncryptedGatewayAccountCookie(
    config.env.TEST_SESSION_ENCRYPTION_KEY,
    selfServiceRequestToGoLiveStageTermsAgreedEpdqUser.gateway_accounts.find(fil => fil.isPrimary === 'true').id
  )
  config.env.encryptedSessionRequestToGoLiveStageTermsAgreedEpdqCookie = encryptedSessionRequestToGoLiveStageTermsAgreedEpdqCookie
  config.env.encryptedGatewayAccountRequestToGoLiveStageTermsAgreedEpdqCookie = encryptedGatewayAccountRequestToGoLiveStageTermsAgreedEpdqCookie

  // REQUEST_TO_GO_LIVE_STAGE_DENIED user
  const selfServiceRequestToGoLiveStageDeniedUser = selfServiceUserConfig.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_STAGE_DENIED')
  const encryptedSessionRequestToGoLiveStageDeniedCookie = generateEncryptedSessionCookie(
    config.env.TEST_SESSION_ENCRYPTION_KEY,
    selfServiceRequestToGoLiveStageDeniedUser.external_id
  )
  const encryptedGatewayAccountRequestToGoLiveStageDeniedCookie = generateEncryptedGatewayAccountCookie(
    config.env.TEST_SESSION_ENCRYPTION_KEY,
    selfServiceRequestToGoLiveStageDeniedUser.gateway_accounts.find(fil => fil.isPrimary === 'true').id
  )
  config.env.encryptedSessionRequestToGoLiveStageDeniedCookie = encryptedSessionRequestToGoLiveStageDeniedCookie
  config.env.encryptedGatewayAccountRequestToGoLiveStageDeniedCookie = encryptedGatewayAccountRequestToGoLiveStageDeniedCookie

  // REQUEST_TO_GO_LIVE_STAGE_LIVE user
  const selfServiceRequestToGoLiveStageLiveUser = selfServiceUserConfig.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_STAGE_LIVE')
  const encryptedSessionRequestToGoLiveStageLiveCookie = generateEncryptedSessionCookie(
    config.env.TEST_SESSION_ENCRYPTION_KEY,
    selfServiceRequestToGoLiveStageLiveUser.external_id
  )
  const encryptedGatewayAccountRequestToGoLiveStageLiveCookie = generateEncryptedGatewayAccountCookie(
    config.env.TEST_SESSION_ENCRYPTION_KEY,
    selfServiceRequestToGoLiveStageLiveUser.gateway_accounts.find(fil => fil.isPrimary === 'true').id
  )
  config.env.encryptedSessionRequestToGoLiveStageLiveCookie = encryptedSessionRequestToGoLiveStageLiveCookie
  config.env.encryptedGatewayAccountRequestToGoLiveStageLiveCookie = encryptedGatewayAccountRequestToGoLiveStageLiveCookie

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
