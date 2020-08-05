'use strict'

const getAdminUsersClient = require('./clients/adminusers.client')

module.exports = {

  /**
   * gets the invite identified by `code`. Assumes its valid (i.e. not expired)
   * @param code
   * @param correlationId
   */
  getValidatedInvite: function (code, correlationId) {
    return getAdminUsersClient({ correlationId: correlationId }).getValidatedInvite(code)
  }
}
