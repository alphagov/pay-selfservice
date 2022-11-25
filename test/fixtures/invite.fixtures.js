'use strict'

const _ = require('lodash')

function buildInviteWithDefaults (opts = {}) {
  const data = {
    type: opts.type || 'user',
    email: opts.email || 'foo@example.com',
    role: opts.role || 'admin',
    disabled: opts.disabled || false,
    user_exist: opts.user_exist || false,
    expired: opts.expired || false,
    otp_key: opts.otp_key || 'ANEXAMPLESECRETSECONDFACTORCODE1'
  }

  if (opts.telephone_number) {
    data.telephone_number = opts.telephone_number
  }

  if (opts.password_set) {
    data.password_set = true
  }

  return data
}

module.exports = {

  validInviteRequest: (opts = {}) => {
    return {
      service_external_id: opts.externalServiceId || '2f1920ea261946bface3c89ddb0a9033',
      email: opts.email || 'random@example.com',
      sender: opts.sender || '94b3d61ebb624a6aa6598b96b307ec8c', // pragma: allowlist secret
      role_name: opts.role_name || 'admin'
    }
  },

  validInviteResponse: (opts = {}) => {
    return buildInviteWithDefaults(opts)
  },

  validListInvitesResponse: (opts = []) => {
    return opts.map(buildInviteWithDefaults)
  },

  notPermittedInviteResponse: (userName, serviceId) => {
    return {
      errors: ['user [' + userName + '] not authorised to perform operation [invite] in service [' + serviceId + ']']
    }
  },

  validRegistrationRequest: (opts = {}) => {
    return {
      telephone_number: opts.telephone_number || '12345678901',
      password: opts.password || 'password1234'
    }
  },

  badRequestResponseWhenFieldsMissing: (missingFields) => {
    const responseData = _.map(missingFields, (field) => {
      return `Field [${field}] is required`
    })
    return {
      errors: responseData
    }
  },

  invalidInviteCreateResponseWhenFieldsMissing: () => {
    return {
      // At the moment to discuss Failfast approach to the API rather than error collection
      errors: ['Field [email] is required']
    }
  },

  conflictingInviteResponseWhenEmailUserAlreadyCreated: (email) => {
    return {
      errors: ['invite with email [' + email + '] already exists']
    }
  },

  validVerifyOtpCodeRequest: (opts = {}) => {
    return {
      code: opts.code || 'a0fd0284f5a64a248fd148fb26b3d93c',
      otp: opts.otp || '123456'
    }
  },

  validResendOtpCodeRequest: (opts = {}) => {
    return {
      code: opts.code || '1e1579ebf2b74981b1261913e4b69e06',
      telephone_number: opts.telephone_number || '01234567891'
    }
  },

  validInviteCompleteRequest: (secondFactorMethod) => {
    return {
      second_factor: secondFactorMethod || 'SMS'
    }
  },

  validInviteCompleteResponse: (opts = {}) => {
    return {
      user_external_id: opts.user_external_id || '0e167175cd194333844fc415131aa5da',
      service_external_id: opts.service_external_id || '6a149c10cf86493e977fdf6765382f65'
    }
  },

  inviteCompleteResponseWithNoServiceExternalId: (opts = {}) => {
    return {
      user_external_id: opts.user_external_id || '0e167175cd194333844fc415131aa5da'
    }
  },

  badRequestResponseWhenNonNumericGatewayAccountIds: (nonNumericGatewayAccountIds) => {
    const responseData = _.map(nonNumericGatewayAccountIds, (field) => {
      return `Field [${field}] must contain numeric values`
    })
    return {
      errors: responseData
    }
  },

  validUpdateInvitePasswordRequest: (password = 'a-password') => {
    return [{
      op: 'replace',
      path: 'password',
      value: password
    }]
  },

  validUpdateInvitePhoneNumberRequest: (phoneNumber = '+44 0808 157 0192') => {
    return [{
      op: 'replace',
      path: 'telephone_number',
      value: phoneNumber
    }]
  }

}
