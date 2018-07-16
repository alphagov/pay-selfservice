'use strict'

// NPM dependencies
const commonPassword = require('common-password')

// Custom dependencies
const getAdminUsersClient = require('./clients/adminusers_client')

// Constants
const MIN_PASSWORD_LENGTH = 10

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
    return getAdminUsersClient({correlationId: correlationId}).authenticateUser(username, submittedPassword)
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

    return getAdminUsersClient({correlationId: correlationId}).authenticateSecondFactor(externalId, code)
  },

  /**
   * @param externalId
   * @param correlationId
   * @returns {Promise<User>}
   */
  findByExternalId: (externalId, correlationId, subSegment) => {
    return getAdminUsersClient({correlationId: correlationId}).getUserByExternalId(externalId, subSegment)
  },

  /**
   * @param {Array} externalId
   * @param {String} correlationId
   * @returns {Promise<User>}
   */
  findMultipleByExternalIds: function (externalIds, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).getUsersByExternalIds(externalIds)
  },

  /**
   * @param {User} user
   * @param correlationId
   * @returns {Promise}
   */
  sendOTP: function (user, correlationId) {
    return getAdminUsersClient({ correlationId: correlationId }).sendSecondFactor(user.externalId, false)
  },

  /**
   * @param {User} user
   * @param correlationId
   * @returns {Promise}
   */
  sendProvisonalOTP: function (user, correlationId) {
    return getAdminUsersClient({
      correlationId: correlationId
    }).sendSecondFactor(user.externalId, true)
  },

  /**
   * @param user
   * @param correlationId
   * @returns {Promise}
   */
  sendPasswordResetToken: function (username, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).createForgottenPassword(username)
  },

  /**
   * @param token
   * @returns {Promise}
   */
  findByResetToken: function (token) {
    return getAdminUsersClient().getForgottenPassword(token)
  },

  /**
   * @param user
   * @param correlationId
   * @returns {Promise}
   */
  logOut: function (user, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).incrementSessionVersionForUser(user.externalId)
  },

  /**
   * @param externalServiceId
   * @param correlationId
   * @returns {Promise}
   */
  getServiceUsers: function (externalServiceId, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).getServiceUsers(externalServiceId)
  },

  /**
   * @param token
   * @param newPassword
   * @returns {Promise}
   */
  updatePassword: function (token, newPassword) {
    return new Promise(function (resolve, reject) {
      if (newPassword.length < MIN_PASSWORD_LENGTH) {
        reject(new Error('Your password must be at least 10 characters.'))
      } else if (commonPassword(newPassword)) {
        reject(new Error('The password you tried to create contains a common phrase or combination of characters. Choose something that’s harder to guess.'))
      } else {
        getAdminUsersClient().updatePasswordForUser(token, newPassword)
          .then(
            () => resolve(),
            () => reject(new Error('There has been a problem updating password.'))
          )
      }
    })
  },

  /**
   * @param externalId
   * @param roleName
   * @param externalServiceId
   * @param correlationId
   * @returns {Promise.<User>}
   */
  updateServiceRole: function (externalId, roleName, externalServiceId, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).updateServiceRole(externalId, externalServiceId, roleName)
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
    return getAdminUsersClient({correlationId: correlationId}).assignServiceRole(externalId, externalServiceId, roleName)
  },

  /**
   * @param invitee
   * @param senderId
   * @param externalServiceId
   * @param roleName
   * @param correlationId
   */
  inviteUser: function (invitee, senderId, externalServiceId, roleName, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).inviteUser(invitee, senderId, externalServiceId, roleName)
  },

  /**
   * @param externalServiceId
   * @param correlationId
   */
  getInvitedUsersList: function (externalServiceId, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).getInvitedUsersList(externalServiceId)
  },

  /**
   *
   * @param externalServiceId
   * @param removerExternalId
   * @param userExternalId
   * @param correlationId
   */
  delete: function (externalServiceId, removerExternalId, userExternalId, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).deleteUser(externalServiceId, removerExternalId, userExternalId)
  },

  /**
   * @param externalId
   * @param correlationId
   * @returns {Promise<User>}
   */
  provisionNewOtpKey: function (externalId, correlationId) {
    if (!externalId) {
       return Promise.reject('No externalId specified')
    }

    return getAdminUsersClient({correlationId: correlationId}).provisionNewOtpKey(externalId)
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
        Promise.reject('No externalId specified')
    }

    return getAdminUsersClient({correlationId: correlationId}).configureNewOtpKey(externalId, code, secondFactor)
  }

}
