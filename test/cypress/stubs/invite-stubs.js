'use strict'

const inviteFixtures = require('../../fixtures/invite.fixtures')
const { stubBuilder } = require('./stub-builder')

function createSelfSignupInviteSuccess (email) {
  const path = '/v1/api/invites/create-self-registration-invite'
  return stubBuilder('POST', path, 200, {
    request: {
      email
    }
  })
}

function createSelfSignupInviteNotPublicSectorEmail (email) {
  const path = '/v1/api/invites/create-self-registration-invite'
  return stubBuilder('POST', path, 403, {
    request: {
      email
    }
  })
}

function createInviteToJoinService (opts, userAlreadyInvited) {
  const path = '/v1/api/invites/create-invite-to-join-service'
  const responseCode = userAlreadyInvited ? 412 : 200
  return stubBuilder('POST', path, responseCode, {
    request: {
      email: opts.email,
      sender: opts.senderId,
      service_external_id: opts.serviceExternalId,
      role_name: opts.roleName
    }
  })
}

function getInvitedUsersSuccess (opts) {
  const path = '/v1/api/invites'
  return stubBuilder('GET', path, 200, {
    query: {
      serviceId: opts.serviceExternalId
    },
    response: inviteFixtures.validListInvitesResponse(opts.invites)
  })
}

function getInviteSuccess (opts) {
  const path = `/v1/api/invites/${opts.code}`
  return stubBuilder('GET', path, 200, {
    response: inviteFixtures.validInviteResponse(opts)
  })
}

function completeInviteSuccess (inviteCode, userExternalId) {
  const path = `/v1/api/invites/${inviteCode}/complete`
  return stubBuilder('POST', path, 200, {
    response: inviteFixtures.validInviteCompleteResponse({ user_external_id: userExternalId })
  })
}

function completeInviteToServiceSuccess (inviteCode, userExternalId, serviceExternalId) {
  const path = `/v1/api/invites/${inviteCode}/complete`
  return stubBuilder('POST', path, 200, {
    response: inviteFixtures.validInviteCompleteResponse({
      user_external_id: userExternalId,
      service_external_id: serviceExternalId
    })
  })
}

function postReprovisionOtpSuccess (opts) {
  const path = `/v1/api/invites/${opts.code}/reprovision-otp`
  return stubBuilder('POST', path, 200, {
    response: inviteFixtures.validInviteResponse(opts)
  })
}

function postSendOtpSuccess (inviteCode) {
  const path = `/v1/api/invites/${inviteCode}/send-otp`
  return stubBuilder('POST', path, 200)
}

function postValidateOtpSuccess (inviteCode, otpCode) {
  const path = '/v2/api/invites/otp/validate'
  return stubBuilder('POST', path, 200)
}

function patchUpdateInvitePasswordSuccess (inviteCode, password) {
  const path = `/v1/api/invites/${inviteCode}`
  return stubBuilder('PATCH', path, 200, {
    request: inviteFixtures.validUpdateInvitePasswordRequest(password),
    deepMatchRequest: true
  })
}

function patchUpdateInvitePhoneNumberSuccess (inviteCode, phoneNumber) {
  const path = `/v1/api/invites/${inviteCode}`
  return stubBuilder('PATCH', path, 200, {
    request: inviteFixtures.validUpdateInvitePhoneNumberRequest(phoneNumber),
    deepMatchRequest: true
  })
}

module.exports = {
  createSelfSignupInviteSuccess,
  createSelfSignupInviteNotPublicSectorEmail,
  createInviteToJoinService,
  getInvitedUsersSuccess,
  getInviteSuccess,
  completeInviteSuccess,
  completeInviteToServiceSuccess,
  postReprovisionOtpSuccess,
  postSendOtpSuccess,
  postValidateOtpSuccess,
  patchUpdateInvitePasswordSuccess,
  patchUpdateInvitePhoneNumberSuccess
}
