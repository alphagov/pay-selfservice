'use strict'

// NPM dependencies
const _ = require('lodash')

// Custom dependencies
const random = require('../../app/utils/random')
const pactBase = require('./pact_base')

// Global setup
const pactInvites = pactBase()

module.exports = {

  validInviteRequest: (opts = {}) => {
    const invitee = 'random@example.com'
    const senderId = random.randomUuid()
    const role = {name: 'admin'}

    const data = {
      service_external_id: opts.externalServiceId || random.randomUuid(),
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
    const invitee = 'random@example.com'
    const type = 'user'
    const disabled = opts.disabled === true

    const data = {
      email: opts.email || invitee,
      type: opts.type || type,
      disabled
    }

    if (opts.telephone_number) {
      data.telephone_number = opts.telephone_number
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

  invalidInviteRequest: (opts = {}) => {
    const senderId = random.randomUuid()
    const role = {name: 'admin'}

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
      code: opts.code || random.randomUuid(),
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
      code: opts.code || random.randomUuid(),
      otp: opts.otp || '123456'
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

  validResendOtpCodeRequest: (opts = {}) => {
    const data = {
      code: opts.code || random.randomUuid(),
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
    opts = opts || {}
    opts.invite = opts.invite || {}

    const inviteInvitee = 'random@example.com'
    const inviteType = 'user'
    const inviteDisabled = opts.invite.disabled === true
    const inviteUserExist = opts.invite.userExist === true
    const invite = {
      code: opts.invite.code || random.randomUuid(),
      email: opts.invite.email || inviteInvitee,
      type: opts.invite.type || inviteType,
      disabled: inviteDisabled,
      userExist: inviteUserExist
    }
    if (opts.invite.telephone_number) {
      invite.invite.telephone_number = opts.invite.telephone_number
    }

    const data = {
      invite,
      userExternalId: opts.userExternalId || random.randomUuid(),
      serviceExternalId: opts.serviceExternalId || random.randomUuid()
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
