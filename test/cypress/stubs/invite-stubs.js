'use strict'

const getInvitedUsersSuccess = function (opts) {
  return {
    name: 'getInvitedUsersSuccess',
    opts: {
      serviceExternalId: opts.serviceExternalId,
      invites: opts.invites
    }
  }
}

module.exports = {
  getInvitedUsersSuccess
}
