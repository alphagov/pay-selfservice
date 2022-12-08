'use strict'

const getAdminUsersClient = require('./clients/adminusers.client')
const adminUsersClient = getAdminUsersClient()

const { SMS } = require('../models/second-factor-method')

module.exports = {

  completeInvite: function completeInvite (code, secondFactorMethod = SMS) {
    return adminUsersClient.completeInvite(code, secondFactorMethod)
  }

}
