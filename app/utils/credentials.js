'use strict'

const paths = require('../paths')
const { InvalidConfigurationError, NotFoundError } = require('../errors')

const CREDENTIAL_STATE = {
  CREATED: 'CREATED',
  ENTERED: 'ENTERED',
  VERIFIED: 'VERIFIED_WITH_LIVE_PAYMENT',
  ACTIVE: 'ACTIVE',
  RETIRED: 'RETIRED'
}

const pendingCredentialStates = [ CREDENTIAL_STATE.CREATED, CREDENTIAL_STATE.ENTERED, CREDENTIAL_STATE.VERIFIED ]

function getCurrentCredential (gatewayAccount = {}) {
  const credentials = gatewayAccount.gateway_account_credentials || []
  return credentials
    .filter((credential) => credential.state === CREDENTIAL_STATE.ACTIVE)[0] || null
}

// gets exactly one switching credential, only given the right account state (one active credential exists)
// throws an error if there's any ambiguity in the target of the switch
function getSwitchingCredential (gatewayAccount = {}) {
  const credentials = gatewayAccount.gateway_account_credentials || []

  // make sure there's an active credential we're switching from
  if (getCurrentCredential(gatewayAccount)) {
    const pendingCredentials = credentials
      .filter((credential) => pendingCredentialStates.includes(credential.state))

    if (!pendingCredentials.length || pendingCredentials.length > 1) {
      throw new InvalidConfigurationError('Unable to determine which credentials are being switched to')
    }
    return pendingCredentials[0]
  } else {
    throw new InvalidConfigurationError('No active credential on this account to switch from')
  }
}

function isSwitchingCredentialsRoute (req) {
  return Object.values(paths.account.switchPSP).includes(req.route && req.route.path)
}

function getPSPPageLinks (gatewayAccount) {
  const supportedYourPSPPageProviders = [ 'worldpay', 'smartpay', 'epdq' ]
  const credentials = (gatewayAccount.gateway_account_credentials || [])
    .filter((credential) => supportedYourPSPPageProviders.includes(credential.payment_provider))

  if (credentials.length === 1) {
    // if there's only one integration, that should always be shown
    return credentials
  } else {
    // pending credentials should be managed through the switch process, only show terminal credential states
    return credentials
      .filter((credential) => [ CREDENTIAL_STATE.RETIRED, CREDENTIAL_STATE.ACTIVE ].includes(credential.state))
  }
}

function getCredentialByExternalId (account, credentialExternalId) {
  const credentials = account.gateway_account_credentials || []
  const credential = credentials.filter((credential) => credential.external_id === credentialExternalId)
  if (!credential.length) {
    throw new NotFoundError('Credential not found on account')
  }
  return credential[0]
}

module.exports = {
  getCurrentCredential,
  getSwitchingCredential,
  isSwitchingCredentialsRoute,
  getPSPPageLinks,
  getCredentialByExternalId,
  CREDENTIAL_STATE
}
