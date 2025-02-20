const { ACTIVE, CREATED, ENTERED } = require('@models/constants/credential-state')
const { STRIPE, WORLDPAY } = require('@models/constants/payment-providers')

const CREDENTIAL_EXTERNAL_ID = 'credential-456-def'
const VALID_MOTO_MERCHANT_CODE = 'helloMOTO'
const VALID_WORLDPAY_USERNAME = 's-mcduck'
const VALID_WORLDPAY_PASSWORD = 'topsecret!!1' // pragma: allowlist secret

const STRIPE_CREDENTIAL_IN_ACTIVE_STATE = {
  state: ACTIVE,
  payment_provider: STRIPE,
  credentials: {
    stripe_account_id: 'acct_blahblahblah'
  }
}

const WORLDPAY_CREDENTIAL_IN_CREATED_STATE = {
  state: CREATED,
  payment_provider: WORLDPAY,
  external_id: CREDENTIAL_EXTERNAL_ID,
  credentials: {}
}

const WORLDPAY_CREDENTIAL_IN_ENTERED_STATE = {
  state: ENTERED,
  payment_provider: WORLDPAY,
  external_id: CREDENTIAL_EXTERNAL_ID,
  credentials: {
    one_off_customer_initiated: {
      merchant_code: VALID_MOTO_MERCHANT_CODE,
      username: VALID_WORLDPAY_USERNAME,
      password: VALID_WORLDPAY_PASSWORD
    }
  }
}

module.exports = {
  STRIPE_CREDENTIAL_IN_ACTIVE_STATE,
  WORLDPAY_CREDENTIAL_IN_CREATED_STATE,
  WORLDPAY_CREDENTIAL_IN_ENTERED_STATE
}
