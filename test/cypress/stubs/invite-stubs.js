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

module.exports = {
  getInvitedUsersSuccess,
  getInviteSuccess
}
