'use strict'

const getAdminUsersClient = require('./clients/adminusers.client')
const adminUsersClient = getAdminUsersClient()

module.exports = {

  /**
   * gets the invite identified by `code`. Assumes its valid (i.e. not expired)
   * @param code
   * @param correlationId
   */
  getValidatedInvite: function (code, correlationId) {
    return adminUsersClient.getValidatedInvite(code, correlationId)
  }
}
