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
      return Promise.reject(new Error('Failed to authenticate'))
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
      return Promise.reject(new Error('Failed to authenticate second factor'))
    }

    return adminUsersClient.authenticateSecondFactor(externalId, code, correlationId)
  },

  /**
   * @param externalId
   * @param correlationId
   * @returns {Promise<User>}
   */
  findByExternalId: (externalId, correlationId, subSegment) => {
    return adminUsersClient.getUserByExternalId(externalId, subSegment, correlationId)
  },

  /**
   * @param {Array} externalId
   * @param {String} correlationId
   * @returns {Promise<User>}
   */
  findMultipleByExternalIds: function (externalIds, correlationId) {
    return adminUsersClient.getUsersByExternalIds(externalIds, correlationId)
  },

  /**
   * @param {User} user
   * @param correlationId
   * @returns {Promise}
   */
  sendOTP: function (user, correlationId) {
    return adminUsersClient.sendSecondFactor(user.externalId, false, correlationId)
  },

  /**
   * @param {User} user
   * @param correlationId
   * @returns {Promise}
   */
  sendProvisonalOTP: function (user, correlationId) {
    return adminUsersClient.sendSecondFactor(user.externalId, true, correlationId)
  },

  /**
   * @param user
   * @param correlationId
   * @returns {Promise}
   */
  sendPasswordResetToken: function (username, correlationId) {
    return adminUsersClient.createForgottenPassword(username, correlationId)
  },

  /**
   * @param token
   * @returns {Promise}
   */
  findByResetToken: function (token) {
    return adminUsersClient.getForgottenPassword(token)
  },

  /**
   * @param user
   * @param correlationId
   * @returns {Promise}
   */
  logOut: function (user, correlationId) {
    return adminUsersClient.incrementSessionVersionForUser(user.externalId, correlationId)
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
   * @returns {Promise}
   */
  updatePassword: function updatePassword (token, newPassword) {
    return adminUsersClient.updatePasswordForUser(token, newPassword)
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
   * @param newPhoneNumber
   * @returns {Promise}
   */
  updatePhoneNumber: function (externalId, newPhoneNumber) {
    return adminUsersClient.updatePhoneNumberForUser(externalId, newPhoneNumber)
  }
}
