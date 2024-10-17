'use strict'

const lodash = require('lodash')
const goLiveStage = require('../../app/models/go-live-stage')
const stripeTestAccountStage = require('../../app/models/psp-test-account-stage')
const serviceFixtures = require('./service.fixtures')
const secondFactorMethod = require('../../app/models/second-factor-method')

// Constants
const defaultPermissions = [
  {
    name: 'users-service:read',
    description: 'Viewusersinservice'
  },
  {
    name: 'users-service:create',
    description: 'Createuserinthisservice'
  },
  {
    name: 'tokens-active:read',
    description: 'Viewactivekeys'
  },
  {
    name: 'tokens-revoked:read',
    description: 'Viewrevokedkeys'
  },
  {
    name: 'tokens:create',
    description: 'Generatekey'
  },
  {
    name: 'tokens:update',
    description: 'Generatekey'
  },
  {
    name: 'tokens:delete',
    description: 'Revokekey'
  },
  {
    name: 'transactions:read',
    description: 'Viewtransactionslist'
  },
  {
    name: 'transactions-by-date:read',
    description: 'Searchtransactionsbydate'
  },
  {
    name: 'transactions-by-fields:read',
    description: 'Searchtransactionsbypaymentfields'
  },
  {
    name: 'transactions-download:read',
    description: 'Downloadtransactions'
  },
  {
    name: 'transactions-details:read',
    description: 'Viewtransactiondetails'
  },
  {
    name: 'transactions-events:read',
    description: 'Viewtransactionevents'
  },
  {
    name: 'refunds:create',
    description: 'Issuerefund'
  },
  {
    name: 'transactions-amount:read',
    description: 'Viewtransactionamounts'
  },
  {
    name: 'transactions-description:read',
    description: 'Viewtransactiondescription'
  },
  {
    name: 'transactions-email:read',
    description: 'Viewtransactionemail'
  },
  {
    name: 'transactions-card-type:read',
    description: 'Viewtransactioncardtype'
  },
  {
    name: 'gateway-credentials:read',
    description: 'Viewgatewayaccountcredentials'
  },
  {
    name: 'gateway-credentials:update',
    description: 'Editgatewayaccountcredentials'
  },
  {
    name: 'service-name:read',
    description: 'Viewservicename'
  },
  {
    name: 'service-name:update',
    description: 'Editservicename'
  },
  {
    name: 'payment-types:read',
    description: 'Viewpaymenttypes'
  },
  {
    name: 'payment-types:update',
    description: 'Editpaymenttypes'
  },
  {
    name: 'email-notification-template:read',
    description: 'Viewemailnotificationstemplate'
  },
  {
    name: 'email-notification-paragraph:update',
    description: 'Editemailnotificationsparagraph'
  },
  {
    name: 'email-notification-toggle:update',
    description: 'Turnemailnotificationson/off'
  },
  {
    name: 'tokens:read',
    description: 'View keys'
  },
  {
    name: 'toggle-3ds:read',
    description: 'View 3D Secure setting'
  },
  {
    name: 'toggle-3ds:update',
    description: 'Edit 3D Secure setting'
  },
  {
    name: 'users-service:delete',
    description: 'Remove user from a service'
  },
  {
    name: 'merchant-details:read',
    description: 'View Merchant Details setting'
  },
  {
    name: 'merchant-details:update',
    description: 'Edit Merchant Details setting'
  },
  {
    name: 'toggle-billing-address:read',
    description: 'View Billing Address setting'
  },
  {
    name: 'toggle-billing-address:update',
    description: 'Edit Billing Address setting'
  },
  {
    name: 'go-live-stage:update',
    description: 'Update Go Live stage'
  },
  {
    name: 'go-live-stage:read',
    description: 'View Go Live stage'
  },
  {
    name: 'stripe-account-details:update',
    description: 'Update any Stripe account onboarding details'
  },
  {
    name: 'stripe-bank-details:update',
    description: 'Update Stripe bank details'
  },
  {
    name: 'stripe-bank-details:read',
    description: 'View Stripe bank details'
  },
  {
    name: 'stripe-responsible-person:update',
    description: 'Update Stripe responsible person'
  },
  {
    name: 'stripe-responsible-person:read',
    description: 'View Stripe responsible person'
  },
  {
    name: 'stripe-director:update',
    description: 'Update Stripe director'
  },
  {
    name: 'stripe-director:read',
    description: 'View Stripe director'
  },
  {
    name: 'stripe-vat-number-company-number:update',
    description: 'Update Stripe VAT number company number'
  },
  {
    name: 'stripe-vat-number-company-number:read',
    description: 'View Stripe VAT number company number'
  },
  {
    name: 'stripe-government-entity-document:update',
    description: 'Upload Government entity document'
  },
  {
    name: 'stripe-organisation-details:update',
    description: 'Check organisation details with Government entity document'
  },
  {
    name: 'connected-gocardless-account:read',
    description: 'View connected go cardless account'
  },
  {
    name: 'connected-gocardless-account:update',
    description: 'Update connected go cardless account'
  },
  {
    name: 'payouts:read',
    description: 'View payouts'
  },
  {
    name: 'moto-mask-input:update',
    description: 'Update moto mask for card number and security code'
  },
  {
    name: 'moto-mask-input:read',
    description: 'View moto mask for card number and security code'
  },
  {
    name: 'psp-test-account-stage:update',
    description: 'Update PSP Test Account stage'
  },
  {
    name: 'webhooks:read',
    description: 'View webhooks'
  },
  {
    name: 'webhooks:update',
    description: 'Update webhooks'
  },
  {
    name: 'agreements:read',
    description: 'View agreements'
  },
  {
    name: 'agreements:update',
    description: 'Update agreements'
  }
]

const buildServiceRole = (opts = {}) => {
  return {
    service: serviceFixtures.validServiceResponse(opts.service),
    role: buildRoleWithDefaults(opts.role)
  }
}

const buildRoleWithDefaults = (opts = {}) => {
  return {
    name: opts.name || 'admin',
    description: opts.role_description || 'Administrator',
    permissions: opts.permissions || defaultPermissions
  }
}

function buildUserWithDefaults (opts) {
  lodash.defaults(opts, {
    external_id: '7d19aff33f8948deb97ed16b2912dcd3',
    email: 'some-user@example.com',
    otp_key: 'krb6fcianbdjkt01ecvi08jcln',
    telephone_number: '9127979',
    second_factor: secondFactorMethod.SMS,
    provisional_otp_key: 'a-provisional-key',
    provisional_otp_key_created_at: null,
    disabled: false,
    login_counter: 0,
    session_version: 0,
    features: null,
    _links: [{
      rel: 'self',
      method: 'GET',
      href: 'http://127.0.0.1:8080/v1/api/users/09283568e105442da3928d1fa99fb0eb'
    }]
  })

  const serviceRoles = opts.service_roles ? lodash.flatMap(opts.service_roles, buildServiceRole) : [buildServiceRole()]
  return {
    external_id: opts.external_id,
    email: opts.email,
    otp_key: opts.otp_key,
    telephone_number: opts.telephone_number,
    service_roles: serviceRoles,
    second_factor: opts.second_factor,
    provisional_otp_key: opts.provisional_otp_key,
    provisional_otp_key_created_at: opts.provisional_otp_key_created_at,
    disabled: opts.disabled,
    login_counter: opts.login_counter,
    session_version: opts.session_version,
    features: opts.features,
    _links: opts._links
  }
}

module.exports = {
  /**
   * @deprecated - use {@link validUserResponse}
   */
  validUser: (opts = {}) => {
    const newExternalId = opts.external_id || '121391373c1844dd99cb3416b70785c8'
    const defaultServiceId = opts.default_service_id || '193'
    const gatewayAccountIds = opts.gateway_account_ids || ['540']
    const collectBillingAddress = (opts.collect_billing_address && opts.collect_billing_address === true)
    const currentGoLiveStage = opts.current_go_live_stage || goLiveStage.NOT_STARTED
    const currentPspTestAccountStage = opts.current_psp_test_account_stage || stripeTestAccountStage.NOT_STARTED
    const agentInitiatedMotoEnabled = opts.agent_initiated_moto_enabled || false

    const userOpts = {
      external_id: opts.external_id || newExternalId,
      email: opts.email || 'user@example.com',
      service_roles: opts.service_roles || [{
        service: {
          name: 'System Generated',
          external_id: defaultServiceId,
          gateway_account_ids: gatewayAccountIds,
          collect_billing_address: collectBillingAddress,
          current_go_live_stage: currentGoLiveStage,
          current_psp_test_account_stage: currentPspTestAccountStage,
          agent_initiated_moto_enabled: agentInitiatedMotoEnabled
        },
        role: opts.role || {
          name: 'admin',
          description: 'Administrator',
          permissions: opts.permissions || [{ name: 'perm-1' }]
        }
      }],
      telephone_number: opts.telephone_number || '940583',
      otp_key: opts.otp_key || '2994',
      disabled: opts.disabled || false,
      login_counter: opts.login_counter || 0,
      session_version: opts.session_version || 0,
      second_factor: opts.second_factor || secondFactorMethod.SMS,
      provisional_otp_key: opts.provisional_otp_key || '60400'
    }

    // pass this through the known valid structure builder to ensure structure is correct
    return buildUserWithDefaults(userOpts)
  },

  validAuthenticateRequest: (options) => {
    return {
      email: options.email || 'username@example.com',
      password: options.password || 'password'
    }
  },

  unauthorizedUserResponse: () => {
    return {
      errors: ['invalid email and/or password']
    }
  },

  badAuthenticateResponse: () => {
    return {
      errors: ['Field [email] is required', 'Field [password] is required']
    }
  },

  validIncrementSessionVersionRequest: () => {
    return {
      op: 'append',
      path: 'sessionVersion',
      value: 1
    }
  },

  validAuthenticateSecondFactorRequest: (code) => {
    return {
      code: code || '123456'
    }
  },

  validUpdatePasswordRequest: (token, newPassword) => {
    return {
      forgotten_password_code: token || '5ylaem',
      new_password: newPassword || 'G0VUkPay2017Rocks'
    }
  },

  validUpdateServiceRoleRequest: (role) => {
    return {
      role_name: role || 'admin'
    }
  },

  validAssignServiceRoleRequest: (opts = {}) => {
    return {
      service_external_id: opts.service_external_id || '9en17v',
      role_name: opts.role_name || 'admin'
    }
  },

  validPasswordAuthenticateRequest: (opts = {}) => {
    return {
      email: opts.email || 'valid-email@example.com',
      password: opts.password || 'validpassword'
    }
  },

  validUserResponse: (opts = {}) => {
    return buildUserWithDefaults(opts)
  },

  validUsersResponse: (opts = []) => {
    return opts.map(buildUserWithDefaults)
  },

  invalidPasswordAuthenticateResponse: () => {
    return {
      errors: ['invalid email and/or password']
    }
  },

  validForgottenPasswordCreateRequest: (username) => {
    return {
      username: username || 'username@email.com'
    }
  },

  validForgottenPasswordResponse: (payload) => {
    const request = payload || {}
    const code = 'h41ne'
    return {
      user_external_id: request.userExternalId || 'userExternalId',
      code: request.code || code,
      date: '2010-12-31T22:59:59.132Z',
      _links: [{
        href: `http://127.0.0.1:8080/v1/api/forgotten-passwords/${code}`,
        rel: 'self',
        method: 'GET'
      }]
    }
  },

  badForgottenPasswordResponse: () => {
    return {
      errors: ['Field [username] is required']
    }
  },

  validUpdateTelephoneNumberRequest: (telephoneNumber) => {
    return {
      op: 'replace',
      path: 'telephone_number',
      value: telephoneNumber
    }
  },

  validUpdateFeaturesRequest: (featuresString) => {
    return {
      op: 'replace',
      path: 'features',
      value: featuresString
    }
  }
}
