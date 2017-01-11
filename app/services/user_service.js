var moment                = require('moment');
var Sequelize             = require('sequelize');
var bcrypt                = require('bcrypt');
var q                     = require('q');
var _                     = require('lodash');

var notp                  = require('notp');
var logger                = require('winston');

var sequelizeConfig       = require('./../utils/sequelize_config.js');
var User                  = require('../models/user.js').User;
var notify                = require('../services/notification_client.js');
var random                = require('../utils/random.js');
var forgottenPassword     = require('../models/forgotten_password.js').sequelize;
var paths                 = require(__dirname + '/../paths.js');
var applicationMetrics    = require('./../utils/metrics.js').metrics;

var sequelizeConnection   = sequelizeConfig.sequelize;

/**
<<<<<<< d8f5c6f23f6c4a4983e7518b97c070018301606d
=======
 * @returns {String}
 */
var generateOTP = function(user) {
  return notp.totp.gen(user.otp_key);
};

/**
>>>>>>> wip trying to fix ss accounts compatibility
 * @param email
 * @param extraFields
 * @param where
 * @returns {*}
 * @private
 */
var _find = function(email, extraFields = [], where) {
  if (!where) where = { email: email };
  if (where.email) where.email = where.email.toLowerCase();
  return User.findOne({
    where: where,
    attributes:[
      'username',
      'email',
      'gateway_account_id',
      'otp_key',
      'id',
      'telephone_number',
      'disabled',
      'login_counter',
      'session_version'
    ].concat(extraFields)
  });
};

/**
 * @param user
 * @param code
 * @param correlationId
 * @param defer
 */
var sendForgottenPasswordEmail = function(user, code, correlationId, defer) {
  template  = process.env.NOTIFY_FORGOTTEN_PASSWORD_EMAIL_TEMPLATE_ID;
  var uri = paths.generateRoute(paths.user.forgottenPasswordReset,{id: code});
  var url = process.env.SELFSERVICE_BASE + uri;
  var startTime = new Date();
  notify.sendEmail(template, user.email, { code: url })
    .then(()=>{
      var elapsed = new Date() - startTime;
      applicationMetrics.histogram('notify-operations.email.response_time', elapsed);
      logger.info(`[${correlationId}] - Sending email ended - elapsed time: %s ms`, elapsed);
      logger.info(`[${correlationId}] FORGOTTEN PASSWORD EMAIL SENT TO USER ID: ` + user.id);
      defer.resolve();
    }, (e)=> {
      var elapsed = new Date() - startTime;
      applicationMetrics.increment('notify-operations.email.failures');
      applicationMetrics.histogram('notify-operations.email.response_time', elapsed);
      logger.info(`[${correlationId}] - Sending email ended - elapsed time: %s ms`, elapsed);
      logger.error(`[${correlationId}] PROBLEM SENDING FORGOTTEN PASSWORD EMAIL `,e);
      defer.reject();
    });
};

var checkUser = function(user, defer) {
  if (user === null) {
    logger.debug('USER NOT FOUND');
    return defer.reject();
  }

  return defer.resolve(user);
};

module.exports = {
  /**
   * @param {User} user
   * @param correlationId
   * @returns {Promise}
   */
  sendOTP: function (user, correlationId) {
    var template = process.env.NOTIFY_2FA_TEMPLATE_ID;
    var defer = q.defer();
    if (user.otp_key && user.telephone_number && template) {
      var code = user.generateOTP();
      var startTime = new Date();
      notify.sendSms(template, user.telephone_number, {code: code})
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

  generateOtp: function (user) {
    return generateOTP(user);
  },

  /**
   * @param user
   * @param correlationId
   * @returns {Promise}
   */
  sendPasswordResetToken: function(user, correlationId){
    var defer = q.defer(),
      code      = random.key(20),
      data      = { date: Date.now(), code: code, userId: user.id };


    forgottenPassword.create(data).then(
      () => sendForgottenPasswordEmail(user, code, correlationId, defer),
      () => {
      logger.warn(`[${correlationId}] PROBLEM CREATING FORGOTTEN PASSWORD. User: `, data.userId);
      defer.reject();
    });

    return defer.promise;
  },

  /**
   * @param username
   * @param correlationId
   * @returns {Promise}
   */
  findByUsername: function (username, correlationId) {
    var defer = q.defer();

    correlationId = correlationId || '';

    _find(undefined, ['password'], {username: username})
      .then((user) => {
        checkUser(user, defer);
      })
      .catch((e)=> {
        logger.debug(`[${correlationId}] find user by email - not found`);
        defer.reject();
      });

    return defer.promise;
  },


  /**
   * @param {String} permissionName name of permission
   * @param {User} user instance to check if is associated to a role with the given permissionName
   *
   * User is associated to a single role and this role must be populated, it cannot happen to exist any
   * user not belonging to a single role (at least for now).
   */
  hasPermission: function (user, permissionName) {
    return user.getRoles()
      .then((roles)=> roles[0]
          .getPermissions({where: {name: permissionName}}).then((permissions)=>
          permissions.length !== 0,
          (e)=> logger.error('Error retrieving permissions of an user', e)),
        (e)=> logger.error('Error retrieving role of user', e)
      );
  },

  /**
   *
   * @param user
   * @param otpKey
   * @returns {Promise}
   */
  updateOtpKey: function (user, otpKey) {
    var defer = q.defer();

    if (!user) return defer.reject();
    user.updateAttributes({otp_key: otpKey})
      .then(defer.resolve, (err)=> {
        defer.reject();
        logger.error('OTP UPDATE ERROR', err);
      });

    return defer.promise;
  },

  /**
   * @param token
   * @returns {Promise}
   */
  findByResetToken: function (token) {
    var defer = q.defer(),
      params = {where: {code: token}};

    forgottenPassword.findOne(params)
      .then((forgotten)=> {
        if (forgotten === null) return defer.reject();
        var current = moment(Date.now()),
          created = moment(forgotten.date),
          duration = Math.ceil(moment.duration(current.diff(created)).asMinutes()),
          timedOut = duration > parseInt(process.env.FORGOTTEN_PASSWORD_EXPIRY_MINUTES),
          notfound = forgotten === null;
        if (notfound || timedOut) return defer.reject();
        return _find(undefined, [], {id: forgotten.userId})
      })
      .then((user)=> checkUser(user, defer))
      .catch(defer.reject);

    return defer.promise;
  },

  /**
   * @param userData
   * @param role
   * @returns {Promise}
   */
  create: function (userData, role) {

    var defer = q.defer(),
      savedUser,
      _user = {
        username: userData.username,
        password: userData.password,
        gateway_account_id: userData.gateway_account_id,
        email: userData.email.toLowerCase(),
        telephone_number: userData.telephone_number,
        otp_key: userData.otp_key ? userData.otp_key : random.key(10)
      };
    if (!role) defer.reject();

    User.create(_user)
      .then((user)=> savedUser = user)
      .then(()=> {
        savedUser.setRole(role)
      })
      .then(() => checkUser(savedUser, defer));

    return defer.promise;
  },

  /**
   * @param username
   * @param submittedPassword
   * @returns {Promise}
   */
  authenticate: function (username, submittedPassword) {
    var defer = q.defer();

    if (!username) {
      return defer.reject();
    }

    _find(undefined, ['password'], {username: username})
      .then((user) => {
        if (!bcrypt.compareSync(submittedPassword, user.password)) {
          defer.reject();
        } else {
          checkUser(user, defer);
        }
      })
      .catch((e) => defer.reject(e));

    return defer.promise;
  },

  /**
   * @param user
   * @returns {Promise}
   */
  logOut: function (user) {
    return user.incrementSessionVersion()
      .then((u) => u.reload())
      .catch((e) => {
        logger.info('user could not be reloaded');
      });
  }
};
