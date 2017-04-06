const q = require('q');
const logger = require('winston');

let getAdminUsersClient = require('./clients/adminusers_client');
let User = require('../models/user').User;
let notify = require('../services/clients/notification_client.js');
let paths = require(__dirname + '/../paths.js');
let applicationMetrics = require('./../utils/metrics.js').metrics;
let commonPassword = require('common-password');
const MIN_PASSWORD_LENGTH = 10;

/**
 * @param user
 * @param code
 * @param correlationId
 * @param defer
 */
let sendForgottenPasswordEmail = function (user, code, correlationId, defer) {
  template = process.env.NOTIFY_FORGOTTEN_PASSWORD_EMAIL_TEMPLATE_ID;
  let uri = paths.generateRoute(paths.user.forgottenPasswordReset, {id: code});
  let url = process.env.SELFSERVICE_BASE + uri;
  let startTime = new Date();
  notify.sendEmail(template, user.email, {code: url})
    .then(() => {
      let elapsed = new Date() - startTime;
      applicationMetrics.histogram('notify-operations.email.response_time', elapsed);
      logger.info(`[${correlationId}] - Sending email ended - elapsed time: %s ms`, elapsed);
      logger.info(`[${correlationId}] FORGOTTEN PASSWORD EMAIL SENT TO USER ID: ` + user.id);
      defer.resolve(user);
    }, (e) => {
      let elapsed = new Date() - startTime;
      applicationMetrics.increment('notify-operations.email.failures');
      applicationMetrics.histogram('notify-operations.email.response_time', elapsed);
      logger.info(`[${correlationId}] - Sending email ended - elapsed time: %s ms`, elapsed);
      logger.error(`[${correlationId}] PROBLEM SENDING FORGOTTEN PASSWORD EMAIL `, e);
      defer.reject();
    });
};

module.exports = {
  /**
   * @param userData
   * @param role
   * @returns {Promise<User>}
   */
  create: function (userData, role) {
    userData.role = role;
    let user = new User(userData);
    return getAdminUsersClient().createUser(user);
  },

  /**
   * @param username
   * @param submittedPassword
   * @param correlationId
   * @returns {Promise<User>}
   */
  authenticate: function (username, submittedPassword, correlationId) {
    let defer = q.defer();

    if (!username || !submittedPassword) {
      return defer.reject();
    }

    return getAdminUsersClient({correlationId: correlationId}).authenticateUser(username, submittedPassword);
  },

  /**
   * @param externalId
   * @param code
   * @param correlationId
   * @returns {Promise<User>}
   */
  authenticateSecondFactor: function (externalId, code, correlationId) {
    let defer = q.defer();
    if (!externalId || !code) {
      return defer.reject();
    }

    return getAdminUsersClient({correlationId: correlationId}).authenticateSecondFactor(externalId, code);
  },

  /**
   * @param externalId
   * @param correlationId
   * @returns {Promise<User>}
   */
  findByExternalId: function (externalId, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).getUserByExternalId(externalId);
  },

  /**
   * @param username
   * @param correlationId
   * @returns {Promise<User>}
   */
  findByUsername: function (username, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).getUserByUsername(username);
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
  sendPasswordResetToken: function (user, correlationId) {
    let defer = q.defer();
    getAdminUsersClient({correlationId: correlationId}).createForgottenPassword(user.username)
      .then((forgottenPassword) => sendForgottenPasswordEmail(user, forgottenPassword.code, correlationId, defer),
        () => {
          logger.warn(`[${correlationId}] PROBLEM CREATING FORGOTTEN PASSWORD. User: `, user.username);
          defer.reject();
        });

    return defer.promise;
  },

  /**
   * @param token
   * @returns {Promise}
   */
  findByResetToken: function (token) {
    return getAdminUsersClient().getForgottenPassword(token);
  },

  /**
   * @param user
   * @param correlationId
   * @returns {Promise}
   */
  logOut: function (user, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).incrementSessionVersionForUser(user.externalId);
  },

  /**
   * @param service_id
   * @param correlationId
   * @returns {Promise}
   */
  getServiceUsers: function (service_id, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).getServiceUsers(service_id);
  },

  /**
   * @param token
   * @param newPassword
   * @returns {Promise}
   */
  updatePassword: function (token, newPassword) {
    let defer = q.defer();

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      defer.reject({message: "Your password must be at least 10 characters."});
    } else if (commonPassword(newPassword)) {
      defer.reject({message: "Your password is too simple. Choose a password that is harder for people to guess."});
    } else {
      getAdminUsersClient().updatePasswordForUser(token, newPassword)
        .then(
          () => defer.resolve(),
          () => defer.reject({message: 'There has been a problem updating password.'}));
    }
    return defer.promise;
  },

  /**
   * @param externalId
   * @param roleName
   * @param serviceId
   * @param correlationId
   * @returns {Promise<User>}
   */
  updateServiceRole: function (externalId, roleName, serviceId, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).updateServiceRole(externalId, serviceId, roleName);
  }

};
