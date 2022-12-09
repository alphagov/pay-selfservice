'use strict'

const inviteFixtures = require('../../fixtures/invite.fixtures')
const { stubBuilder } = require('./stub-builder')

function createSelfSignupInviteSuccess (email) {
  const path = '/v1/api/invites/service'
  return stubBuilder('POST', path, 200, {
    request: {
      email
    }
  })
}

function createSelfSignupInviteNotPublicSectorEmail (email) {
  const path = '/v1/api/invites/service'
  return stubBuilder('POST', path, 403, {
    request: {
      email
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

function reprovisionOtpSuccess (opts) {
  const path = `/v1/api/invites/${opts.code}/reprovision-otp`
  return stubBuilder('POST', path, 200, {
    response: inviteFixtures.validInviteResponse(opts)
  })
}

module.exports = {
  createSelfSignupInviteSuccess,
  createSelfSignupInviteNotPublicSectorEmail,
  getInvitedUsersSuccess,
  getInviteSuccess,
  completeInviteSuccess,
  completeInviteToServiceSuccess,
  reprovisionOtpSuccess
}
