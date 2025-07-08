const { ACTIVE, CREATED, ENTERED, VERIFIED, RETIRED } = require('@models/constants/credential-state')
const { STRIPE, WORLDPAY } = require('@models/constants/payment-providers')

const CREDENTIAL_EXTERNAL_ID_1 = 'credential-123-abc'
const CREDENTIAL_EXTERNAL_ID_2 = 'credential-456-def'
const VALID_MOTO_MERCHANT_CODE = 'helloMOTO'
const VALID_WORLDPAY_USERNAME = 's-mcduck'
const VALID_WORLDPAY_PASSWORD = 'topsecret!!1' // pragma: allowlist secret
const VALID_STRIPE_ACCOUNT_ID = 'acct_blahblahblah'

const STRIPE_CREDENTIAL_IN_ACTIVE_STATE = {
  state: ACTIVE,
  payment_provider: STRIPE,
  credentials: {
    stripe_account_id: VALID_STRIPE_ACCOUNT_ID
  },
  external_id: CREDENTIAL_EXTERNAL_ID_1
}

const WORLDPAY_CREDENTIAL_IN_CREATED_STATE = {
  state: CREATED,
  payment_provider: WORLDPAY,
  external_id: CREDENTIAL_EXTERNAL_ID_2,
  credentials: {}
}

const WORLDPAY_CREDENTIAL_IN_ENTERED_STATE = {
  state: ENTERED,
  payment_provider: WORLDPAY,
  external_id: CREDENTIAL_EXTERNAL_ID_2,
  credentials: {
    one_off_customer_initiated: {
      merchant_code: VALID_MOTO_MERCHANT_CODE,
      username: VALID_WORLDPAY_USERNAME,
      password: VALID_WORLDPAY_PASSWORD
    }
  }
}

const WORLDPAY_CREDENTIAL_IN_VERIFIED_STATE = {
  state: VERIFIED,
  payment_provider: WORLDPAY,
  external_id: CREDENTIAL_EXTERNAL_ID_2,
  credentials: {
    one_off_customer_initiated: {
      merchant_code: VALID_MOTO_MERCHANT_CODE,
      username: VALID_WORLDPAY_USERNAME,
      password: VALID_WORLDPAY_PASSWORD
    }
  }
}

const WORLDPAY_CREDENTIAL_IN_ACTIVE_STATE = {
  state: ACTIVE,
  payment_provider: WORLDPAY,
  external_id: CREDENTIAL_EXTERNAL_ID_1,
  credentials: {
    one_off_customer_initiated: {
      merchant_code: VALID_MOTO_MERCHANT_CODE,
      username: VALID_WORLDPAY_USERNAME,
      password: VALID_WORLDPAY_PASSWORD
    }
  }
}

const WORLDPAY_CREDENTIAL_IN_RETIRED_STATE = {
  state: RETIRED,
  payment_provider: WORLDPAY,
  external_id: CREDENTIAL_EXTERNAL_ID_1,
  credentials: {
    one_off_customer_initiated: {
      merchant_code: VALID_MOTO_MERCHANT_CODE,
      username: VALID_WORLDPAY_USERNAME,
      password: VALID_WORLDPAY_PASSWORD
    }
  }
}

const SWITCHED_WORLDPAY_CREDENTIAL_IN_ACTIVE_STATE = {
  state: ACTIVE,
  payment_provider: WORLDPAY,
  external_id: CREDENTIAL_EXTERNAL_ID_2,
  credentials: {
    one_off_customer_initiated: {
      merchant_code: VALID_MOTO_MERCHANT_CODE,
      username: VALID_WORLDPAY_USERNAME,
      password: VALID_WORLDPAY_PASSWORD
    }
  }
}

const WORLDPAY_CREDENTIALS = {
  ONE_OFF: {
    CREATED: WORLDPAY_CREDENTIAL_IN_CREATED_STATE,
    PENDING: WORLDPAY_CREDENTIAL_IN_ENTERED_STATE,
    VERIFIED: WORLDPAY_CREDENTIAL_IN_VERIFIED_STATE,
    ACTIVE: WORLDPAY_CREDENTIAL_IN_ACTIVE_STATE,
    RETIRED: WORLDPAY_CREDENTIAL_IN_RETIRED_STATE,
    SWITCHED: SWITCHED_WORLDPAY_CREDENTIAL_IN_ACTIVE_STATE
  }
}



module.exports = {
  STRIPE_CREDENTIAL_IN_ACTIVE_STATE,
  WORLDPAY_CREDENTIAL_IN_CREATED_STATE,
  WORLDPAY_CREDENTIAL_IN_ENTERED_STATE,
  WORLDPAY_CREDENTIAL_IN_VERIFIED_STATE,
  WORLDPAY_CREDENTIAL_IN_ACTIVE_STATE,
  SWITCHED_WORLDPAY_CREDENTIAL_IN_ACTIVE_STATE,
  WORLDPAY_CREDENTIALS,
}
