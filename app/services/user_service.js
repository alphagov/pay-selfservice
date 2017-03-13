const q = require('q');
const logger = require('winston');

var getAdminUsersClient = require('./clients/adminusers_client');
var User = require('../models/user').User;
var notify = require('../services/clients/notification_client.js');
var paths = require(__dirname + '/../paths.js');
var applicationMetrics = require('./../utils/metrics.js').metrics;
var commonPassword = require('common-password');
const MIN_PASSWORD_LENGTH = 10;

/**
 * @param user
 * @param code
 * @param correlationId
 * @param defer
 */
var sendForgottenPasswordEmail = function (user, code, correlationId, defer) {
  template = process.env.NOTIFY_FORGOTTEN_PASSWORD_EMAIL_TEMPLATE_ID;
  var uri = paths.generateRoute(paths.user.forgottenPasswordReset, {id: code});
  var url = process.env.SELFSERVICE_BASE + uri;
  var startTime = new Date();
  notify.sendEmail(template, user.email, {code: url})
    .then(() => {
      var elapsed = new Date() - startTime;
      applicationMetrics.histogram('notify-operations.email.response_time', elapsed);
      logger.info(`[${correlationId}] - Sending email ended - elapsed time: %s ms`, elapsed);
      logger.info(`[${correlationId}] FORGOTTEN PASSWORD EMAIL SENT TO USER ID: ` + user.id);
      defer.resolve(user);
    }, (e) => {
      var elapsed = new Date() - startTime;
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
   * @returns {Promise<User>}
   */
  authenticate: function (username, submittedPassword, correlationId) {
    var defer = q.defer();

    if (!username || !submittedPassword) {
      return defer.reject();
    }

    return getAdminUsersClient({correlationId: correlationId}).authenticateUser(username, submittedPassword);
  },

  /**
   * @param username
   * @param correlationId
   * @returns {Promise<User>}
   */
  findByUsername: function (username, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).getUser(username);
  },

  /**
   * @param {User} user
   * @param correlationId
   * @returns {Promise}
   */
  sendOTP: function (user, correlationId) {
    var template = process.env.NOTIFY_2FA_TEMPLATE_ID;
    var defer = q.defer();
    if (user.otpKey && user.telephoneNumber && template) {
      var code = user.generateOTP();
      var startTime = new Date();
      notify.sendSms(template, user.telephoneNumber, {code: code})
        .then(() => {
          var elapsed = new Date() - startTime;
          applicationMetrics.histogram('notify-operations.sms.response_time', elapsed);
          logger.info(`[${correlationId}] - Sending sms ended - elapsed time: %s ms`, elapsed);
          defer.resolve();
        }, (e) => {
          var elapsed = new Date() - startTime;
          applicationMetrics.increment('notify-operations.sms.failures');
          applicationMetrics.histogram('notify-operations.sms.response_time', elapsed);
          logger.info(`[${correlationId}] - Sending sms ended - elapsed time: %s ms`, elapsed);
          logger.error(`[${correlationId}] error while sending sms`, e);
          defer.reject(e);
        });
    } else {
      logger.error(`[${correlationId}] missing required field to send sms`);
      defer.reject('missing required field to send sms');
    }
    return defer.promise;
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
   * @returns {Promise}
   */
  logOut: function (user, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).incrementSessionVersionForUser(user.username);
  },

  /**
   * @param token
   * @param username
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
   *
   * @param username
   * @returns {Promise}
   */
  resetLoginCount: function (username, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).resetLoginAttemptsForUser(username);
  },

  incrementLoginCount: function (username, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).incrementLoginAttemptsForUser(username);
  }
};
