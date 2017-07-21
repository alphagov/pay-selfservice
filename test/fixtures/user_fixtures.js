'use strict'

// NPM dependencies
const _ = require('lodash')

// Custom dependencies
let User = require('../../app/models/User.class')
let pactBase = require('./pact_base')
let pactUsers = pactBase({array: ['permissions', 'gateway_account_ids', 'service_ids']})
let random = require('../../app/utils/random')

function randomString () {
  return Math.random().toString(36).substring(7)
}

function validPassword () {
  return 'G0VUkPay2017Rocks'
}

function randomUsername () {
  return randomString()
}

function randomOtpKey () {
  return String(Math.floor(Math.random() * 100000) + 1)
}

function randomAccountId () {
  return String(Math.floor(Math.random() * 1000) + 1)
}

function randomServiceId () {
  return String(Math.floor(Math.random() * 1000) + 1)
}

function randomTelephoneNumber () {
  return String(Math.floor(Math.random() * 1000000) + 1)
}

module.exports = {

  validMinimalUser: () => {
    let newExternalId = random.randomUuid()
    let newUsername = randomUsername()
    let defaultServiceId = randomServiceId()
    let accountIds = [randomAccountId()]

    let data = {
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
      telephone_number: randomTelephoneNumber()
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
    let newExternalId = random.randomUuid()
    let newUsername = randomUsername()
    let defaultServiceId = opts.default_service_id || randomServiceId()
    let gatewayAccountIds = opts.gateway_account_ids || [randomAccountId()]

    let data = {
      external_id: opts.external_id || newExternalId,
      username: opts.username || newUsername,
      email: opts.email || `${newUsername}@example.com`,
      service_roles: opts.service_roles || [{
        service: {
          name: 'System Generated',
          external_id: defaultServiceId,
          gateway_account_ids: gatewayAccountIds
        },
        role: opts.role || {
          name: 'admin',
          description: 'Administrator',
          permissions: opts.permissions || [{name: 'perm-1'}]
        }
      }],
      telephone_number: opts.telephone_number || String(Math.floor(Math.random() * 1000000)),
      otp_key: opts.otp_key || randomOtpKey(),
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

  /**
   * @param request Params override response
   * @return {{getPactified: (function()) Pact response, getAsObject: (function()) User, getPlain: (function()) request with overrides applied}}
   */
  validUserResponse: (request = {}) => {
    let existingExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    let reqExternalId = request.external_id || existingExternalId
    let reqUsername = request.username || 'existing-user'
    let defaultServiceId = randomString()
    const gatewayAccountIds = request.gateway_account_ids || [randomAccountId()]

    let data = {
      external_id: reqExternalId,
      username: reqUsername,
      email: request.email || `${reqUsername}@example.com`,
      service_roles: request.service_roles || [{
        service: {
          name: 'System Generated',
          external_id: defaultServiceId,
          gateway_account_ids: gatewayAccountIds
        },
        role: {
          name: 'admin',
          description: 'Administrator',
          permissions: request.permissions || [{name: 'perm-1'}, {name: 'perm-2'}, {name: 'perm-3'}],
          '_links': [{
            'href': `http://adminusers.service/v1/api/users/${reqExternalId}`,
            'rel': 'self',
            'method': 'GET'
          }]
        }
      }],
      otp_key: request.otp_key || '43c3c4t',
      telephone_number: request.telephone_number || '0123441',
      '_links': [{
        'href': `http://adminusers.service/v1/api/users/${reqExternalId}`,
        'rel': 'self',
        'method': 'GET'
      }]
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

  validCreateUserRequest: () => {
    let newUsername = randomUsername()
    let role = {name: 'admin'}
    let defaultServiceId = randomServiceId()

    let data = {
      username: newUsername,
      email: `${newUsername}@example.com`,
      gateway_account_ids: [randomAccountId()],
      service_ids: [defaultServiceId],
      telephone_number: randomTelephoneNumber(),
      role_name: role.name
    }

    return {
      getPactified: () => {
        return pactUsers.pactify(data)
      },

      getPlain: () => {
        return data
      }
    }
  },

  validAuthenticateRequest: (options) => {
    let request = {
      username: options.username || 'username',
      password: options.password || 'password'
    }

    return pactUsers.withPactified(request)
  },

  unauthorizedUserResponse: () => {
    let response = {
      errors: ['invalid username and/or password']
    }

    return pactUsers.withPactified(response)
  },

  badAuthenticateResponse: () => {
    let response = {
      errors: ['Field [username] is required', 'Field [password] is required']
    }

    return pactUsers.withPactified(response)
  },

  validIncrementSessionVersionRequest: () => {
    let request = {
      op: 'append',
      path: 'sessionVersion',
      value: 1
    }

    return pactUsers.withPactified(request)
  },

  validAuthenticateSecondFactorRequest: (code) => {
    let request = {
      code: code || '123456'
    }

    return pactUsers.withPactified(request)
  },

  validUpdatePasswordRequest: (token, newPassword) => {
    let request = {
      forgotten_password_code: token || randomString(),
      new_password: newPassword || validPassword()
    }

    return pactUsers.withPactified(request)
  },

  validUpdateServiceRoleRequest: (role) => {
    let request = {
      role_name: role || 'admin'
    }

    return pactUsers.withPactified(request)
  },

  validAssignServiceRoleRequest: (serviceExternalId, role) => {
    let request = {
      service_external_id: serviceExternalId || randomString(),
      role_name: role || 'admin'
    }

    return pactUsers.withPactified(request)
  },

  validForgottenPasswordCreateRequest: (username) => {
    let request = {
      username: username || 'username'
    }

    return pactUsers.withPactified(request)
  },

  validForgottenPasswordResponse: (payload) => {
    let request = payload || {}
    let code = randomString()
    let response = {
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
    let response = {
      errors: ['Field [username] is required']
    }

    return pactUsers.withPactified(response)
  },

  badRequestResponseWhenFieldsMissing: (missingFields) => {
    const responseData = _.map(missingFields, (field) => {
      return `Field [${field}] is required`
    })
    const response = {
      errors: responseData
    }

    return pactUsers.withPactified(response)
  }

}
