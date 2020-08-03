'use strict'

// NPM dependencies
const _ = require('lodash')

const pactBase = require('./pact-base')

// Global setup
const pactInvites = pactBase()

function buildInviteWithDefaults (opts) {
  const data = _.defaults(opts, {
    type: 'user',
    email: 'foo@example.com',
    role: 'admin',
    disabled: false,
    attempt_counter: 0,
    _links: [],
    user_exist: false,
    expired: false
  })

  if (opts.telephone_number) {
    data.telephone_number = opts.telephone_number
  }

  return data
}

module.exports = {

  validInviteRequest: (opts = {}) => {
    const invitee = 'random@example.com'
    const senderId = '94b3d61ebb624a6aa6598b96b307ec8c'
    const role = { name: 'admin' }

    const data = {
      service_external_id: opts.externalServiceId || '2f1920ea261946bface3c89ddb0a9033',
      email: opts.email || invitee,
      sender: opts.sender || senderId,
      role_name: opts.role_name || role
    }

    return {
      getPactified: () => {
        return pactInvites.pactify(data)
      },
      getPlain: () => {
        return data
      }
    }
  },

  validInviteResponse: (opts = {}) => {
    const data = buildInviteWithDefaults(opts)

    return {
      getPactified: () => {
        return pactInvites.pactify(data)
      },
      getPlain: () => {
        return _.clone(data)
      }
    }
  },

  validListInvitesResponse: (opts = []) => {
    const data = opts.map(buildInviteWithDefaults)

    return {
      getPactified: () => {
        return pactInvites.pactify(data)
      },
      getPlain: () => {
        return _.clone(data)
      }
    }
  },

  invalidInviteRequest: (opts = {}) => {
    const senderId = 'e6bbf9a1633044d7aa7700b51d6de373'
    const role = { name: 'admin' }

    const data = {
      service_external_id: opts.externalServiceId,
      email: opts.email || '',
      sender: opts.sender || senderId,
      role_name: opts.role_name || role
    }

    return {
      getPactified: () => {
        return pactInvites.pactify(data)
      },
      getPlain: () => {
        return data
      }
    }
  },

  notPermittedInviteResponse: (userName, serviceId) => {
    const response = {
      errors: ['user [' + userName + '] not authorised to perform operation [invite] in service [' + serviceId + ']']
    }

    return pactInvites.withPactified(response)
  },

  validRegistrationRequest: (opts = {}) => {
    const data = {
      telephone_number: opts.telephone_number || '12345678901',
      password: opts.password || 'password1234'
    }

    return {
      getPactified: () => {
        return pactInvites.pactify(data)
      },
      getPlain: () => {
        return data
      }
    }
  },

  badRequestResponseWhenFieldsMissing: (missingFields) => {
    const responseData = _.map(missingFields, (field) => {
      return `Field [${field}] is required`
    })
    const response = {
      errors: responseData
    }

    return pactInvites.withPactified(response)
  },

  invalidInviteCreateResponseWhenFieldsMissing: () => {
    const response = {
      // At the moment to discuss Failfast approach to the API rather than error collection
      errors: ['Field [email] is required']
    }

    return pactInvites.withPactified(response)
  },

  conflictingInviteResponseWhenEmailUserAlreadyCreated: (email) => {
    const response = {
      errors: ['invite with email [' + email + '] already exists']
    }

    return {
      getPactified: () => {
        return pactInvites.withPactified(response)
      },
      getPlain: () => {
        return response
      }
    }
  },

  validVerifyOtpCodeRequest: (opts = {}) => {
    const data = {
      code: opts.code || 'a0fd0284f5a64a248fd148fb26b3d93c',
      otp: opts.otp || '123456'
    }

    return {
      getPactified: () => {
        return pactInvites.pactify(data)
      },
      getPlain: () => {
        return _.clone(data)
      }
    }
  },

  validResendOtpCodeRequest: (opts = {}) => {
    const data = {
      code: opts.code || '1e1579ebf2b74981b1261913e4b69e06',
      telephone_number: opts.telephone_number || '01234567891'
    }

    return {
      getPactified: () => {
        return pactInvites.pactify(data)
      },
      getPlain: () => {
        return data
      }
    }
  },

  validInviteCompleteRequest: (opts = {}) => {
    opts = opts || {}

    const gatewayAccountIds = opts.gateway_account_ids || []
    const data = {
      gateway_account_ids: gatewayAccountIds
    }

    return {
      getPactified: () => {
        return pactInvites.pactify(data)
      },
      getPlain: () => {
        return _.clone(data)
      }
    }
  },

  validInviteCompleteResponse: (opts = {}) => {
    const invite = buildInviteWithDefaults(opts.invite)

    const data = {
      invite,
      user_external_id: opts.user_external_id || '0e167175cd194333844fc415131aa5da',
      service_external_id: opts.service_external_id || '6a149c10cf86493e977fdf6765382f65'
    }

    return {
      getPactified: () => {
        return pactInvites.pactify(data)
      },
      getPlain: () => {
        return _.clone(data)
      }
    }
  },

  badRequestResponseWhenNonNumericGatewayAccountIds: (nonNumericGatewayAccountIds) => {
    const responseData = _.map(nonNumericGatewayAccountIds, (field) => {
      return `Field [${field}] must contain numeric values`
    })
    const response = {
      errors: responseData
    }

    return {
      getPactified: () => {
        return pactInvites.pactify(response)
      },
      getPlain: () => {
        return _.clone(response)
      }
    }
  }

}
