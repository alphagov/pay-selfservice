const userStubs = require('@test/cypress/stubs/user-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const { ACTIVE } = require('@models/constants/credential-state')
const { STRIPE } = require('@models/constants/payment-providers')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service-456-def'
const GATEWAY_ACCOUNT_ID = 11
const ACCOUNT_TYPE = 'test'

const setupStubs = ({
  role,
  collectBillingAddress,
  isDefaultBillingAddressCountryUK,
  allowApplePay,
  allowGooglePay,
  serviceName
} = {}) => {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: { en: serviceName ?? 'My card payment service' },
      serviceExternalId: SERVICE_EXTERNAL_ID,
      role: ROLES[role ?? 'admin'],
      collectBillingAddress: collectBillingAddress ?? true,
      defaultBillingAddressCountry: getDefaultBillingAddressCountry(isDefaultBillingAddressCountryUK),
      features: 'degatewayaccountification' // TODO remove features once simplified accounts are live
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, {
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      allow_apple_pay: allowApplePay ?? true,
      allow_google_pay: allowGooglePay ?? true,
      gateway_account_credentials: [
        {
          state: ACTIVE,
          payment_provider: STRIPE,
          credentials: {
            stripe_account_id: 'acct_blahblahblah'
          }
        }
      ]
    })
  ])
}

function getDefaultBillingAddressCountry (isDefaultBillingAddressCountryUK) {
  if (isDefaultBillingAddressCountryUK === undefined) {
    return 'GB'
  }
  if (isDefaultBillingAddressCountryUK === false) {
    return null
  }
  return 'GB'
}

module.exports = {
  setupStubs,
  USER_EXTERNAL_ID,
  SERVICE_EXTERNAL_ID,
  GATEWAY_ACCOUNT_ID,
  ACCOUNT_TYPE
}
