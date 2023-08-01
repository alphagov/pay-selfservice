'use strict'

const getAdminUsersClient = require('./clients/adminusers.client')
const adminUsersClient = getAdminUsersClient()

module.exports = {

  /**
   * @param email
   * @param submittedPassword
   * @returns {Promise<User>}
   */
  authenticate: function (email, submittedPassword) {
    if (!email || !submittedPassword) {
      return Promise.reject(new Error('Failed to authenticate'))
    }
    return adminUsersClient.authenticateUser(email, submittedPassword)
  },

  /**
   * @param externalId
   * @param code
   * @returns {Promise<User>}
   */
  authenticateSecondFactor: function (externalId, code) {
    if (!externalId || !code) {
      return Promise.reject(new Error('Failed to authenticate second factor'))
    }

    return adminUsersClient.authenticateSecondFactor(externalId, code)
  },

  /**
   * @param externalId
   * @returns {Promise<User>}
   */
  findByExternalId: (externalId) => {
    return adminUsersClient.getUserByExternalId(externalId)
  },

  /**
   * @param {Array} externalIds
   * @returns {Promise<User>}
   */
  findMultipleByExternalIds: function (externalIds) {
    return adminUsersClient.getUsersByExternalIds(externalIds)
  },

  /**
   * @param {String} userExternalId
   * @returns {Promise}
   */
  sendOTP: function (userExternalId) {
    return adminUsersClient.sendSecondFactor(userExternalId, false)
  },

  /**
   * @param {String} userExternalId
   * @returns {Promise}
   */
  sendProvisionalOTP: function (userExternalId) {
    return adminUsersClient.sendSecondFactor(userExternalId, true)
  },

  /**
   * @param username
   * @returns {Promise}
   */
  sendPasswordResetToken: function (username) {
    return adminUsersClient.createForgottenPassword(username)
  },

  /**
   * @param token
   * @returns {Promise}
   */
  findByResetToken: function (token) {
    return adminUsersClient.getForgottenPassword(token)
  },

  /**
   * @param {String} userExternalId
   * @returns {Promise}
   */
  logOut: function (userExternalId) {
    return adminUsersClient.incrementSessionVersionForUser(userExternalId)
  },

  /**
   * @param externalServiceId
   * @returns {Promise}
   */
  getServiceUsers: function (externalServiceId) {
    return adminUsersClient.getServiceUsers(externalServiceId)
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
   * @returns {Promise.<User>}
   */
  updateServiceRole: function (externalId, roleName, externalServiceId) {
    return adminUsersClient.updateServiceRole(externalId, externalServiceId, roleName)
  },

  /**
   *
   * @param externalId
   * @param externalServiceId
   * @param roleName
   * @returns {Promise.<User>}
   */
  assignServiceRole: function (externalId, externalServiceId, roleName) {
    return adminUsersClient.assignServiceRole(externalId, externalServiceId, roleName)
  },

  /**
   * @param invitee
   * @param senderId
   * @param externalServiceId
   * @param roleName
   */
  createInviteToJoinService: function (invitee, senderId, externalServiceId, roleName) {
    return adminUsersClient.createInviteToJoinService(invitee, senderId, externalServiceId, roleName)
  },

  /**
   * @param externalServiceId
   */
  getInvitedUsersList: function (externalServiceId) {
    return adminUsersClient.getInvitedUsersList(externalServiceId)
  },

  /**
   *
   * @param externalServiceId
   * @param removerExternalId
   * @param userExternalId
   */
  delete: function (externalServiceId, removerExternalId, userExternalId) {
    return adminUsersClient.deleteUser(externalServiceId, removerExternalId, userExternalId)
  },

  /**
   * @param externalId
   * @returns {Promise<User>}
   */
  provisionNewOtpKey: function (externalId) {
    if (!externalId) {
      return Promise.reject(new Error('No externalId specified'))
    }

    return adminUsersClient.provisionNewOtpKey(externalId)
  },

  /**
   * @param externalId
   * @param code
   * @param secondFactor
   * @returns {Promise<User>}
   */
  configureNewOtpKey: function (externalId, code, secondFactor) {
    if (!externalId) {
      return Promise.reject(new Error('No externalId specified'))
    }

    return adminUsersClient.configureNewOtpKey(externalId, code, secondFactor)
  },

  /**
   * @param externalId
   * @param newPhoneNumber
   * @returns {Promise}
   */
  updatePhoneNumber: function (externalId, newPhoneNumber) {
    return adminUsersClient.updatePhoneNumberForUser(externalId, newPhoneNumber)
  }
}
