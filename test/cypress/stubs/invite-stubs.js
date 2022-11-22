'use strict'

const inviteFixtures = require('../../fixtures/invite.fixtures')
const { stubBuilder } = require('./stub-builder')

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

module.exports = {
  getInvitedUsersSuccess,
  getInviteSuccess,
  completeInviteSuccess
}
