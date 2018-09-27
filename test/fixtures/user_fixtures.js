'use strict'

// NPM dependencies
const _ = require('lodash')

// Custom dependencies
const User = require('../../app/models/User.class')
const pactBase = require('./pact_base')
const pactUsers = pactBase(
  {
    array: ['permissions', 'gateway_account_ids', 'service_ids', 'service_roles', 'services', '_links'],
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
    const newExternalId = '121391373c1844dd99cb3416b70785c8'
    const newUsername = 'm87bmh'
    const defaultServiceId = opts.default_service_id || '193'
    const gatewayAccountIds = opts.gateway_account_ids || ['540']

    const data = {
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
   * @param request Params override response
   * @return {{getPactified: (function()) Pact response, getAsObject: (function()) User, getPlain: (function()) request with overrides applied}}
   */
  validUserResponse: (request = {}) => {
    const existingExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    const reqExternalId = request.external_id || existingExternalId
    const reqEmail = request.email || `${request.username || 'existing-user'}@example.com`
    const defaultServiceId = 'cp5wa'
    const gatewayAccountIds = request.gateway_account_ids || [758, 772]

    const data = {
      external_id: reqExternalId,
      username: reqEmail,
      email: reqEmail,
      service_roles: request.service_roles || [{
        service: {
          name: 'System Generated',
          external_id: defaultServiceId,
          gateway_account_ids: gatewayAccountIds
        },
        role: {
          name: 'admin',
          description: 'Administrator',
          permissions: [{name: 'perm-1'}, {name: 'perm-2'}, {name: 'perm-3'}]
        }
      }],
      otp_key: request.otp_key || '43c3c4t',
      telephone_number: request.telephone_number || '0123441',
      '_links': [{
        'href': `http://adminusers.service/v1/api/users/${reqExternalId}`,
        'rel': 'self',
        'method': 'GET'
      }],
      second_factor: request.second_factor || 'SMS',
      provisional_otp_key: request.provisional_otp_key || '55970'
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
    const response =
      {
        external_id: opts.external_id || '09283568e105442da3928d1fa99fb0eb',
        is_platform_admin: opts.is_platform_admin || false,
        username: opts.username || 'nbGscObDSKxf31CjF0uzGRwnOaNyztKw@example.com',
        email: opts.email || 'nbGscObDSKxf31CjF0uzGRwnOaNyztKw@example.com',
        otp_key: opts.otp_key || 'nlcj80ivce10tkjdbnaicf6brk',
        telephone_number: opts.telephone_number || '9797219',
        service_roles: opts.service_roles || [
          {
            service: {
              id: 857,
              external_id: '0ab3525259894209bbc8d2a5b0538fc0',
              name: 'System Generated',
              gateway_account_ids: [
                '923'
              ],
              _links: []
            },
            role: {
              name: 'admin',
              description: 'Administrator',
              permissions: [
                {
                  name: 'users-service:read',
                  description: 'Viewusersinservice'
                }
              ]
            }
          }
        ],
        second_factor: opts.second_factor || 'SMS',
        provisional_otp_key: opts.provisional_otp_key || null,
        services: opts.services || [{
          id: 857,
          external_id: '0ab3525259894209bbc8d2a5b0538fc0',
          name: 'System Generated',
          gateway_account_ids: [
            '923'
          ],
          _links: []
        }],
        disabled: opts.disabled || false,
        login_counter: opts.login_counter || 0,
        session_version: opts.session_version || 0,
        service_ids: opts.service_ids || ['857'],
        _links: opts._links || [{
          rel: 'self',
          method: 'GET',
          href: 'http://localhost:8080/v1/api/users/09283568e105442da3928d1fa99fb0eb'
        }],
        role: opts.role || {
          name: 'admin',
          description:
            'Administrator',
          permissions:
            [
              {
                name: 'users-service:read',
                description: 'Viewusersinservice'
              }
            ]
        },
        permissions: opts.permissions || [
          'users-service:read'
        ]
      }
    // Only add admin_service_roles to the fixture if it has been specified
    if (opts.admin_service_roles) {
      response.admin_service_roles = opts.admin_service_roles
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
    const responseData = _.map(missingFields, (field) => {
      return `Field [${field}] is required`
    })
    const response = {
      errors: responseData
    }

    return pactUsers.withPactified(response)
  }
}
