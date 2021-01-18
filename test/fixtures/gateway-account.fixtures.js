'use strict'

function validCredentials (opts = {}) {
  const credentials = {
    merchant_id: opts.merchant_id || 'merchant-id',
    username: opts.username || 'username'
  }

  if (opts.sha_in_passphrase) {
    credentials.sha_in_passphrase = opts.sha_in_passphrase
  }
  if (opts.sha_out_passphrase) {
    credentials.sha_out_passphrase = opts.sha_out_passphrase
  }
  return credentials
}

function validNotificationCredentials (opts = {}) {
  return {
    userName: opts.username || 'username',
  }
}

function validWorldpay3dsFlexCredentials (opts = {}) {
  return {
    organisational_unit_id: opts.organisational_unit_id || '5bd9b55e4444761ac0af1c80',
    issuer: opts.issuer || '5bd9e0e4444dce153428c940', // pragma: allowlist secret
    exemption_engine_enabled: opts.exemption_engine_enabled || false
  }
}

function validGatewayAccount (opts) {
  const gatewayAccount = {
    payment_provider: opts.payment_provider || 'sandbox',
    gateway_account_id: opts.gateway_account_id || 31,
    external_id: opts.external_id || 'a-valid-external-id',
    allow_apple_pay: opts.allow_apple_pay || false,
    allow_google_pay: opts.allow_google_pay || false,
    service_name: opts.service_name || 'A fabulous service',
    type: opts.type || 'test',
    email_collection_mode: opts.email_collection_mode || 'MANDATORY',
    email_notifications: opts.email_notifications || {
      PAYMENT_CONFIRMED: {
        version: 1,
        enabled: true,
        template_body: 'template here'
      },
      REFUND_ISSUED: {
        version: 1,
        enabled: true
      }
    },
    allow_moto: opts.allow_moto || false,
    moto_mask_card_number_input: opts.moto_mask_card_number_input || false,
    moto_mask_card_security_code_input: opts.moto_mask_card_security_code_input || false,
    requires3ds: opts.requires3ds || false,
    integration_version_3ds: opts.integrationVersion3ds || 1
  }

  if (opts.description) {
    gatewayAccount.description = opts.description
  }
  if (opts.analytics_id) {
    gatewayAccount.analytics_id = opts.analytics_id
  }
  if (opts.credentials) {
    gatewayAccount.credentials = validCredentials(opts.credentials)
  }
  if (opts.notificationCredentials) {
    gatewayAccount.notificationCredentials = validNotificationCredentials(opts.notificationCredentials)
  }
  if (opts.worldpay_3ds_flex) {
    gatewayAccount.worldpay_3ds_flex = validWorldpay3dsFlexCredentials(opts.worldpay_3ds_flex)
  }

  return gatewayAccount
}

function validGatewayAccountPatchRequest (opts = {}) {
  return {
    op: 'replace',
    path: opts.path,
    value: opts.value
  }
}

function validGatewayAccountEmailRefundToggleRequest (enabled = true) {
  return {
    op: 'replace',
    path: '/refund/enabled',
    value: enabled
  }
}

function validGatewayAccountEmailConfirmationToggleRequest (enabled = true) {
  return {
    op: 'replace',
    path: '/confirmation/enabled',
    value: enabled
  }
}

function validGatewayAccountEmailCollectionModeRequest (collectionMode = 'MANDATORY') {
  return {
    op: 'replace',
    path: 'email_collection_mode',
    value: collectionMode
  }
}

function validGatewayAccountTokensResponse (opts = {}) {
  return {
    tokens:
      [{
        issued_date: opts.issued_date || '03 Sep 2018 - 10:05',
        last_used: opts.last_used || null,
        token_link: opts.token_link || '32fa3cdd-23c8-4602-a415-b48ede66b5e4',
        description: opts.description || 'Created from command line',
        token_type: opts.token_type || 'CARD',
        created_by: opts.created_by || 'System generated'
      }]
  }
}

function validGatewayAccountResponse (opts = {}) {
  return validGatewayAccount(opts)
}

function validGatewayAccountsResponse (opts = {}) {
  const accounts = opts.accounts.map(validGatewayAccount)
  return {
    accounts: accounts
  }
}

function validDirectDebitGatewayAccountResponse (opts = {}) {
  return {
    gateway_account_id: opts.gateway_account_id || 73,
    gateway_account_external_id: opts.gateway_account_external_id || 'DIRECT_DEBIT:' + 'a9c797ab271448bdba21359e15672076',
    payment_provider: opts.payment_provider || 'sandbox',
    type: opts.type || 'test',
    analytics_id: opts.analytics_id || 'd82dae5bcb024828bb686574a932b5a5',
    is_connected: opts.is_connected || false
  }
}

function validCreateGatewayAccountRequest (opts = {}) {
  const data = {
    payment_provider: opts.payment_provider || 'sandbox',
    service_name: opts.service_name || 'This is an account for the GOV.UK Pay team',
    type: opts.type || 'test'
  }

  if (opts.analytics_id) {
    data.analytics_id = opts.analytics_id
  }
  return data
}


module.exports = {
  validGatewayAccountPatchRequest,
  validGatewayAccountEmailRefundToggleRequest,
  validGatewayAccountEmailConfirmationToggleRequest,
  validGatewayAccountEmailCollectionModeRequest,
  validGatewayAccountTokensResponse,
  validGatewayAccountResponse,
  validGatewayAccountsResponse,
  validDirectDebitGatewayAccountResponse,
  validCreateGatewayAccountRequest
}
