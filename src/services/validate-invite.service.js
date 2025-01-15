'use strict'

const getAdminUsersClient = require('./clients/adminusers.client')
const adminUsersClient = getAdminUsersClient()

module.exports = {

  /**
   * gets the invite identified by `code`. Assumes its valid (i.e. not expired)
   * @param code
   */
  getValidatedInvite: function (code) {
    return adminUsersClient.getValidatedInvite(code)
  }
}
