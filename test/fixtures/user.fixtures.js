'use strict'

const lodash = require('lodash')

const User = require('../../app/models/User.class')
const pactBase = require('./pact-base')
const goLiveStage = require('../../app/models/go-live-stage')
const serviceFixtures = require('./service.fixtures')

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
    name: 'stripe-vat-number-company-number:update',
    description: 'Update Stripe VAT number company number'
  },
  {
    name: 'stripe-vat-number-company-number:read',
    description: 'View Stripe VAT number company number'
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
  }
]

// Setup
const pactUsers = pactBase({
  array: ['service_roles', '_links'],
  length: [{ key: 'permissions', length: 1 }]
})

const buildServiceRole = (opts = {}) => {
  return {
    service: serviceFixtures.validServiceResponse(opts.service).getPlain(),
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
    username: 'some-user@example.com',
    email: 'some-user@example.com',
    otp_key: 'krb6fcianbdjkt01ecvi08jcln',
    telephone_number: '9127979',
    second_factor: 'SMS',
    provisional_otp_key: 'a-provisional-key',
    provisional_otp_key_created_at: null,
    disabled: false,
    login_counter: 0,
    session_version: 0,
    _links: [{
      rel: 'self',
      method: 'GET',
      href: 'http://localhost:8080/v1/api/users/09283568e105442da3928d1fa99fb0eb'
    }]
  })

  const serviceRoles = opts.service_roles ? lodash.flatMap(opts.service_roles, buildServiceRole) : [buildServiceRole()]
  return {
    external_id: opts.external_id,
    username: opts.username,
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
    _links: opts._links
  }
}

module.exports = {
  /**
   * @deprecated - use {@link validUserResponse}
   */
  validUser: (opts = {}) => {
    const newExternalId = opts.external_id || '121391373c1844dd99cb3416b70785c8'
    const newUsername = 'm87bmh'
    const defaultServiceId = opts.default_service_id || '193'
    const gatewayAccountIds = opts.gateway_account_ids || ['540']
    const collectBillingAddress = (opts.collect_billing_address && opts.collect_billing_address === true)
    const currentGoLiveStage = opts.current_go_live_stage || goLiveStage.NOT_STARTED

    const userOpts = {
      external_id: opts.external_id || newExternalId,
      username: opts.username || newUsername,
      email: opts.email || `${newUsername}@example.com`,
      service_roles: opts.service_roles || [{
        service: {
          name: 'System Generated',
          external_id: defaultServiceId,
          gateway_account_ids: gatewayAccountIds,
          collect_billing_address: collectBillingAddress,
          current_go_live_stage: currentGoLiveStage
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
      second_factor: opts.second_factor || 'SMS',
      provisional_otp_key: opts.provisional_otp_key || '60400'
    }

    // pass this through the known valid structure builder to ensure structure is correct
    const data = buildUserWithDefaults(userOpts)

    return {
      getPactified: () => {
        return pactUsers.pactify(data)
      },
      getAsObject: () => {
        return new User(data)
      },
      getPlain: () => {
        return data
      }
    }
  },

  /**
   * @param request Params override response
   * @return {{getPactified: (function()) Pact response, getAsObject: (function()) User, getPlain: (function()) request with overrides applied}}
   */
  validMultipleUserResponse: (opts = []) => {
    const data = opts.map(buildUserWithDefaults)
    return {
      getPactified: () => {
        return data.map(pactUsers.pactify)
      },
      getAsObject: () => {
        return data.map(datum => new User(datum))
      },
      getPlain: () => {
        return data
      }
    }
  },

  validAuthenticateRequest: (options) => {
    const request = {
      username: options.username || 'username',
      password: options.password || 'password'
    }

    return pactUsers.withPactified(request)
  },

  unauthorizedUserResponse: () => {
    const response = {
      errors: ['invalid username and/or password']
    }

    return pactUsers.withPactified(response)
  },

  badAuthenticateResponse: () => {
    const response = {
      errors: ['Field [username] is required', 'Field [password] is required']
    }

    return pactUsers.withPactified(response)
  },

  validIncrementSessionVersionRequest: () => {
    const request = {
      op: 'append',
      path: 'sessionVersion',
      value: 1
    }

    return pactUsers.withPactified(request)
  },

  validAuthenticateSecondFactorRequest: (code) => {
    const request = {
      code: code || '123456'
    }

    return pactUsers.withPactified(request)
  },

  validUpdatePasswordRequest: (token, newPassword) => {
    const request = {
      forgotten_password_code: token || '5ylaem',
      new_password: newPassword || 'G0VUkPay2017Rocks'
    }

    return pactUsers.withPactified(request)
  },

  validUpdateServiceRoleRequest: (role) => {
    const request = {
      role_name: role || 'admin'
    }

    return pactUsers.withPactified(request)
  },

  validAssignServiceRoleRequest: (opts = {}) => {
    const request = {
      service_external_id: opts.service_external_id || '9en17v',
      role_name: opts.role_name || 'admin'
    }

    return pactUsers.withPactified(request)
  },

  validPasswordAuthenticateRequest: (opts = {}) => {
    const usernameGenerate = opts.username || 'validuser'
    const usernameMatcher = opts.usernameMatcher || 'validuser'

    const passwordGenerate = opts.password || 'validpassword'
    const passwordMatcher = opts.passwordMatcher || 'validpassword'

    return {
      username: pactUsers.pactifyMatch(usernameGenerate, usernameMatcher),
      password: pactUsers.pactifyMatch(passwordGenerate, passwordMatcher)
    }
  },

  invalidPasswordAuthenticateRequest: (opts = {}) => {
    const usernameGenerate = opts.username || 'validuser'
    const usernameMatcher = opts.usernameMatcher || 'validuser'

    const passwordGenerate = opts.password || 'invalidpassword'
    const passwordMatcher = opts.passwordMatcher || 'invalidpassword'

    return {
      username: pactUsers.pactifyMatch(usernameGenerate, usernameMatcher),
      password: pactUsers.pactifyMatch(passwordGenerate, passwordMatcher)
    }
  },

  validUserResponse: (opts = {}) => {
    const data = buildUserWithDefaults(opts)

    return {
      getPactified: () => {
        return pactUsers.pactify(data)
      },
      getAsObject: () => {
        return new User(data)
      },
      getPlain: () => {
        return data
      }
    }
  },

  validUsersResponse: (opts = []) => {
    const users = opts.map(buildUserWithDefaults)

    return {
      getPactified: () => {
        return pactUsers.pactify(users)
      },
      getAsObject: () => {
        const usersObject = []
        users.forEach(user => usersObject.push(new User(user)))
        return new User(usersObject)
      },
      getPlain: () => {
        return users
      }
    }
  },

  invalidPasswordAuthenticateResponse: () => {
    const response = {
      errors: ['invalid username and/or password']
    }

    return pactUsers.withPactified(response)
  },

  validForgottenPasswordCreateRequest: (username) => {
    const request = {
      username: username || 'username@email.com'
    }

    return pactUsers.withPactified(request)
  },

  validForgottenPasswordResponse: (payload) => {
    const request = payload || {}
    const code = 'h41ne'
    const response = {
      user_external_id: request.userExternalId || 'userExternalId',
      code: request.code || code,
      date: '2010-12-31T22:59:59.132Z',
      '_links': [{
        'href': `http://localhost:8080/v1/api/forgotten-passwords/${code}`,
        'rel': 'self',
        'method': 'GET'
      }]
    }

    return pactUsers.withPactified(response)
  },

  badForgottenPasswordResponse: () => {
    const response = {
      errors: ['Field [username] is required']
    }

    return pactUsers.withPactified(response)
  },

  badRequestResponseWhenFieldsMissing: (missingFields) => {
    const responseData = lodash.map(missingFields, (field) => {
      return `Field [${field}] is required`
    })
    const response = {
      errors: responseData
    }

    return pactUsers.withPactified(response)
  }
}
