'use strict'

// NPM dependencies
const lodash = require('lodash')
const { expect } = require('chai')

// Local dependencies
const User = require('../../app/models/User.class')
const pactBase = require('./pact_base')
const goLiveStage = require('../../app/models/go-live-stage')

// Constants
const defaultPermissions = [
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
  }
]

// Setup
const pactUsers = pactBase(
  {
    array: ['service_roles', '_links'],
    length: [{key: 'permissions', length: 1}]
  })

function validPassword () {
  return 'G0VUkPay2017Rocks'
}

function merchantDetailsFixture () {
  return {
    name: 'name',
    address_line1: 'line1',
    address_line2: 'line2',
    address_city: 'City',
    address_postcode: 'POSTCODE',
    address_country: 'GB'
  }
}

const validServiceRole = (opts = {}) => {
  return {
    service: validService(opts.service),
    role: validRole(opts.role)
  }
}

const validService = (opts = {}) => {
  const service = {
    id: opts.id || 857,
    external_id: opts.external_id || 'cp5wa',
    name: opts.name || 'System Generated',
    gateway_account_ids: opts.gateway_account_ids || [
      '666'
    ],
    _links: opts.links || [],
    redirect_to_service_immediately_on_terminal_state: opts.redirect_to_service_immediately_on_terminal_state || false,
    collect_billing_address: opts.collect_billing_address || false,
    current_go_live_stage: opts.current_go_live_stage || 'NOT_STARTED'
  }

  if (opts.merchant_details) {
    service.merchant_details = validMerchantDetails(opts.merchant_details)
  }

  return service
}

const validRole = (opts = {}) => {
  return {
    name: opts.role_name || 'admin',
    description: opts.role_description || 'Administrator',
    permissions: opts.permissions || defaultPermissions
  }
}

const validMerchantDetails = (opts = {}) => {
  const merchantDetails = {
    name: opts.name || 'name',
    address_line1: opts.address_line1 || 'line1',
    address_line2: opts.address_line2 || 'line2',
    address_city: opts.address_city || 'City',
    address_postcode: opts.address_postcode || 'POSTCODE',
    address_country: opts.address_country || 'GB'
  }

  if (opts.telephone_number) {
    merchantDetails.telephone_number = opts.telephone_number
  }
  if (opts.email) {
    merchantDetails.email = opts.email
  }

  return merchantDetails
}

module.exports = {

  validMinimalUser: () => {
    const newExternalId = '8e1a29e4f66e409693d6e530bff7a642'
    const newUsername = '5nxja'
    const defaultServiceId = '535'
    const accountIds = ['507']

    const data = {
      external_id: newExternalId,
      username: newUsername,
      email: `${newUsername}@example.com`,
      service_roles: [{
        service: {
          name: 'System Generated',
          external_id: defaultServiceId,
          gateway_account_ids: accountIds
        },
        role: {
          name: 'admin',
          description: 'Administrator',
          permissions: ['perm-1']
        }
      }],
      telephone_number: '07700 95665',
      secondFactor: 'SMS'
    }

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
  validUserWithMerchantDetails: (opts = {}) => {
    const newExternalId = '79d686ec43bc4768b2600d2e1e41e54e'
    const newUsername = '6fu6kr'
    const defaultServiceId = opts.default_service_id || '946'
    const gatewayAccountIds = opts.gateway_account_ids || ['218']
    const merchantDetails = opts.merchant_details || merchantDetailsFixture()

    const data = {
      external_id: opts.external_id || newExternalId,
      username: opts.username || newUsername,
      email: opts.email || `${newUsername}@example.com`,
      service_roles: opts.service_roles || [{
        service: {
          name: 'System Generated',
          external_id: defaultServiceId,
          gateway_account_ids: gatewayAccountIds,
          merchant_details: merchantDetails
        },
        role: opts.role || {
          name: 'admin',
          description: 'Administrator',
          permissions: opts.permissions || [{name: 'perm-1'}]
        }
      }],
      telephone_number: opts.telephone_number || '922037',
      otp_key: opts.otp_key || '56609',
      disabled: opts.disabled || false,
      login_counter: opts.login_counter || 0,
      session_version: opts.session_version || 0
    }
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
  validUser: (opts = {}) => {
    const newExternalId = opts.external_id || '121391373c1844dd99cb3416b70785c8'
    const newUsername = 'm87bmh'
    const defaultServiceId = opts.default_service_id || '193'
    const gatewayAccountIds = opts.gateway_account_ids || ['540']
    const collectBillingAddress = (opts.collect_billing_address && opts.collect_billing_address === true)
    const currentGoLiveStage = opts.current_go_live_stage || goLiveStage.NOT_STARTED

    const data = {
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
          permissions: opts.permissions || [{name: 'perm-1'}]
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
   * @param opts Params override response
   * @return {{getPactified: (function()) Pact response, getAsObject: (function()) User, getPlain: (function()) request with overrides applied}}
   */
  validUserResponse: (opts = {}) => {
    const existingExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    const reqExternalId = opts.external_id || existingExternalId
    const reqEmail = opts.email || `${opts.username || 'existing-user'}@example.com`
    const defaultServiceId = 'cp5wa'
    const defaultServiceName = 'System Generated'
    const gatewayAccountIds = opts.gateway_account_ids || [758, 772]
    const merchantDetails = opts.merchant_details || {}
    const merchantName = merchantDetails.name || 'updated-merchant-details-name'
    const merchantTelephoneNumber = merchantDetails.telephone_number || '03069990000'
    const merchantEmail = merchantDetails.email || 'dd-merchant@example.com'
    const merchantAddressLine1 = merchantDetails.address_line1 || 'updated-merchant-details-addressline1'
    const merchantAddressLine2 = merchantDetails.address_line2 || 'updated-merchant-details-addressline2'
    const merchantAddressCity = merchantDetails.address_city || 'updated-merchant-details-city'
    const merchantAddressPostcode = merchantDetails.address_postcode || 'updated-merchant-details-postcode'
    const merchantAddressCountry = merchantDetails.address_country || 'updated-merchant-details-country'
    const collectBillingAddress = opts.collect_billing_address || false
    const currentGoLiveStage = opts.current_go_live_stage || goLiveStage.NOT_STARTED

    const data = {
      external_id: reqExternalId,
      username: reqEmail,
      email: reqEmail,
      service_roles: opts.service_roles || [{
        service: {
          name: defaultServiceName,
          external_id: defaultServiceId,
          gateway_account_ids: gatewayAccountIds,
          service_name: {
            en: defaultServiceName
          },
          merchant_details: {
            name: merchantName,
            telephone_number: merchantTelephoneNumber,
            email: merchantEmail,
            address_line1: merchantAddressLine1,
            address_line2: merchantAddressLine2,
            address_city: merchantAddressCity,
            address_postcode: merchantAddressPostcode,
            address_country: merchantAddressCountry
          },
          collect_billing_address: collectBillingAddress,
          current_go_live_stage: currentGoLiveStage
        },
        role: {
          name: 'admin',
          description: 'Administrator',
          permissions: [{name: 'perm-1'}, {name: 'perm-2'}, {name: 'perm-3'}]
        }
      }],
      otp_key: opts.otp_key || '43c3c4t',
      telephone_number: opts.telephone_number || '0123441',
      '_links': [{
        'href': `http://adminusers.service/v1/api/users/${reqExternalId}`,
        'rel': 'self',
        'method': 'GET'
      }],
      second_factor: opts.second_factor || 'SMS',
      provisional_otp_key: opts.provisional_otp_key || '55970'
    }

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
    if (opts.length === 0) opts.push({})
    const data = []

    opts.forEach(intendedUser => {
      const externalId = intendedUser.external_id || '8d8db4f2ad7d4c0c8373a09d9e95468b'
      const username = intendedUser.username || 'b9g0vm'
      const gatewayAccountIds = intendedUser.gateway_account_ids || ['213', '270']

      data.push({
        external_id: externalId,
        username: username,
        email: intendedUser.email || `${username}@example.com`,
        service_roles: intendedUser.service_roles || [{
          service: {
            name: 'System Generated',
            external_id: '0a9aa1216b93460a963f125b3f12e530',
            gateway_account_ids: gatewayAccountIds
          },
          role: {
            name: 'admin',
            description: 'Administrator',
            permissions: intendedUser.permissions || [{name: 'perm-1'}, {name: 'perm-2'}, {name: 'perm-3'}]
          }
        }],
        otp_key: intendedUser.otp_key || '7200b91bc4ba4eac958d3d7c33f119b1',
        telephone_number: intendedUser.telephone_number || '07700 91044',
        '_links': [{
          'href': `http://adminusers.service/v1/api/users/${externalId}`,
          'rel': 'self',
          'method': 'GET'
        }]
      })
    })

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
      new_password: newPassword || validPassword()
    }

    return pactUsers.withPactified(request)
  },

  validUpdateServiceRoleRequest: (role) => {
    const request = {
      role_name: role || 'admin'
    }

    return pactUsers.withPactified(request)
  },

  validAssignServiceRoleRequest: (serviceExternalId, role) => {
    const request = {
      service_external_id: serviceExternalId || '9en17v',
      role_name: role || 'admin'
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

  validPasswordAuthenticateResponse: (opts = {}) => {
    const serviceRoles = opts.service_roles ? lodash.flatMap(opts.service_roles, validServiceRole) : [validServiceRole()]
    const response = {
      external_id: opts.external_id || '7d19aff33f8948deb97ed16b2912dcd3',
      username: opts.username || 'some-user@gov.uk',
      email: opts.email || 'some-user@gov.uk',
      otp_key: opts.otp_key || 'krb6fcianbdjkt01ecvi08jcln',
      telephone_number: opts.telephone_number || '9127979',
      service_roles: serviceRoles,
      second_factor: opts.second_factor || 'SMS',
      provisional_otp_key: opts.provisional_otp_key || 'a-provisional-key',
      provisional_otp_key_created_at: opts.provisional_otp_key_created_at || null,
      disabled: opts.disabled || false,
      login_counter: opts.login_counter || 0,
      session_version: opts.session_version || 0,
      _links: opts._links || [{
        rel: 'self',
        method: 'GET',
        href: 'http://localhost:8080/v1/api/users/09283568e105442da3928d1fa99fb0eb'
      }]
    }

    return pactUsers.withPactified(response)
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
