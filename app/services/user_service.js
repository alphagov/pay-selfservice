const q = require('q')

const getAdminUsersClient = require('./clients/adminusers_client')
const commonPassword = require('common-password')

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
      let defer = q.defer()
      defer.reject()
      return defer.promise
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
      let defer = q.defer()
      defer.reject()
      return defer.promise
    }

    return getAdminUsersClient({correlationId: correlationId}).authenticateSecondFactor(externalId, code)
  },

  /**
   * @param externalId
   * @param correlationId
   * @returns {Promise<User>}
   */
  findByExternalId: function (externalId, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).getUserByExternalId(externalId)
  },

  /**
   * @param {User} user
   * @param correlationId
   * @returns {Promise}
   */
  sendOTP: function (user, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).sendSecondFactor(user.externalId)
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
   * @param serviceId
   * @param correlationId
   * @returns {Promise}
   */
  getServiceUsers: function (serviceId, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).getServiceUsers(serviceId)
  },

  /**
   * @param token
   * @param newPassword
   * @returns {Promise}
   */
  updatePassword: function (token, newPassword) {
    let defer = q.defer()

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      defer.reject({message: 'Your password must be at least 10 characters.'})
    } else if (commonPassword(newPassword)) {
      defer.reject({message: 'Your password is too simple. Choose a password that is harder for people to guess.'})
    } else {
      getAdminUsersClient().updatePasswordForUser(token, newPassword)
        .then(
          () => defer.resolve(),
          () => defer.reject({message: 'There has been a problem updating password.'}))
    }
    return defer.promise
  },

  /**
   * @param externalId
   * @param roleName
   * @param serviceId
   * @param correlationId
   * @returns {Promise<User>}
   */
  updateServiceRole: function (externalId, roleName, serviceId, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).updateServiceRole(externalId, serviceId, roleName)
  },

  /**
   * @param invitee
   * @param senderId
   * @param serviceId
   * @param roleName
   * @param correlationId
   */
  inviteUser: function (invitee, senderId, serviceId, roleName, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).inviteUser(invitee, senderId, serviceId, roleName)
  },

  /**
   *
   * @param serviceId
   * @param removerId
   * @param userId
   */
  delete: function (serviceId, removerId, userId, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).deleteUser(serviceId, removerId, userId)
  }
}
