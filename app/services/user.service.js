'use strict'

const getAdminUsersClient = require('./clients/adminusers.client')
const adminUsersClient = getAdminUsersClient()

module.exports = {

  /**
   * @param username
   * @param submittedPassword
   * @param correlationId
   * @returns {Promise<User>}
   */
  authenticate: function (username, submittedPassword, correlationId) {
    if (!username || !submittedPassword) {
      return new Promise(function (resolve, reject) {
        reject(new Error('Failed to authenticate'))
      })
    }
    return adminUsersClient.authenticateUser(username, submittedPassword, correlationId)
  },

  /**
   * @param externalId
   * @param code
   * @param correlationId
   * @returns {Promise<User>}
   */
  authenticateSecondFactor: function (externalId, code, correlationId) {
    if (!externalId || !code) {
      return new Promise(function (resolve, reject) {
        reject(new Error('Failed to authenticate second factor'))
      })
    }

    return adminUsersClient.authenticateSecondFactor(externalId, code, correlationId)
  },

  /**
   * @param externalId
   * @param correlationId
   * @returns {Promise<User>}
   */
  findByExternalId: (externalId, correlationId) => {
    return adminUsersClient.getUserByExternalId(externalId, correlationId)
  },

  /**
   * @param {Array} externalIds
   * @param {String} correlationId
   * @returns {Promise<User>}
   */
  findMultipleByExternalIds: function (externalIds, correlationId) {
    return adminUsersClient.getUsersByExternalIds(externalIds, correlationId)
  },

  /**
   * @param {String} userExternalId
   * @param {String} correlationId
   * @returns {Promise}
   */
  sendOTP: function (userExternalId, correlationId) {
    return adminUsersClient.sendSecondFactor(userExternalId, false, correlationId)
  },

  /**
   * @param {String} userExternalId
   * @param {String} correlationId
   * @returns {Promise}
   */
  sendProvisionalOTP: function (userExternalId, correlationId) {
    return adminUsersClient.sendSecondFactor(userExternalId, true, correlationId)
  },

  /**
   * @param username
   * @param correlationId
   * @returns {Promise}
   */
  sendPasswordResetToken: function (username, correlationId) {
    return adminUsersClient.createForgottenPassword(username, correlationId)
  },

  /**
   * @param token
   * @param correlationId
   * @returns {Promise}
   */
  findByResetToken: function (token, correlationId) {
    return adminUsersClient.getForgottenPassword(token, correlationId)
  },

  /**
   * @param {String} userExternalId
   * @param {String} correlationId
   * @returns {Promise}
   */
  logOut: function (userExternalId, correlationId) {
    return adminUsersClient.incrementSessionVersionForUser(userExternalId, correlationId)
  },

  /**
   * @param externalServiceId
   * @param correlationId
   * @returns {Promise}
   */
  getServiceUsers: function (externalServiceId, correlationId) {
    return adminUsersClient.getServiceUsers(externalServiceId, correlationId)
  },

  /**
   * @param token
   * @param newPassword
   * @param correlationId
   * @returns {Promise}
   */
  updatePassword: function updatePassword (token, newPassword, correlationId) {
    return adminUsersClient.updatePasswordForUser(token, newPassword, correlationId)
  },

  /**
   * @param externalId
   * @param roleName
   * @param externalServiceId
   * @param correlationId
   * @returns {Promise.<User>}
   */
  updateServiceRole: function (externalId, roleName, externalServiceId, correlationId) {
    return adminUsersClient.updateServiceRole(externalId, externalServiceId, roleName, correlationId)
  },

  /**
   *
   * @param externalId
   * @param externalServiceId
   * @param roleName
   * @param correlationId
   * @returns {Promise.<User>}
   */
  assignServiceRole: function (externalId, externalServiceId, roleName, correlationId) {
    return adminUsersClient.assignServiceRole(externalId, externalServiceId, roleName, correlationId)
  },

  /**
   * @param invitee
   * @param senderId
   * @param externalServiceId
   * @param roleName
   * @param correlationId
   */
  inviteUser: function (invitee, senderId, externalServiceId, roleName, correlationId) {
    return adminUsersClient.inviteUser(invitee, senderId, externalServiceId, roleName, correlationId)
  },

  /**
   * @param externalServiceId
   * @param correlationId
   */
  getInvitedUsersList: function (externalServiceId, correlationId) {
    return adminUsersClient.getInvitedUsersList(externalServiceId, correlationId)
  },

  /**
   *
   * @param externalServiceId
   * @param removerExternalId
   * @param userExternalId
   * @param correlationId
   */
  delete: function (externalServiceId, removerExternalId, userExternalId, correlationId) {
    return adminUsersClient.deleteUser(externalServiceId, removerExternalId, userExternalId, correlationId)
  },

  /**
   * @param externalId
   * @param correlationId
   * @returns {Promise<User>}
   */
  provisionNewOtpKey: function (externalId, correlationId) {
    if (!externalId) {
      return Promise.reject(new Error('No externalId specified'))
    }

    return adminUsersClient.provisionNewOtpKey(externalId, correlationId)
  },

  /**
   * @param externalId
   * @param code
   * @param secondFactor
   * @param correlationId
   * @returns {Promise<User>}
   */
  configureNewOtpKey: function (externalId, code, secondFactor, correlationId) {
    if (!externalId) {
      Promise.reject(new Error('No externalId specified'))
    }

    return adminUsersClient.configureNewOtpKey(externalId, code, secondFactor, correlationId)
  },

  /**
   * @param externalId
   * @param newPhoneNumber
   * @param correlationId
   * @returns {Promise}
   */
  updatePhoneNumber: function (externalId, newPhoneNumber, correlationId) {
    return adminUsersClient.updatePhoneNumberForUser(externalId, newPhoneNumber, correlationId)
  }
}
