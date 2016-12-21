var sequelizeConfig       = require('./../utils/sequelize_config.js');
var sequelizeConnection   = sequelizeConfig.sequelize;
var Sequelize             = require('sequelize');
var User                  = require('../models/user.js');
var bcrypt                = require('bcrypt');
var q                     = require('q');
var _                     = require('lodash');
var notify                = require('../services/notification_client.js');
var notp                  = require('notp');
var random                = require('../utils/random.js');
var logger                = require('winston');
var forgottenPassword     = require('../models/forgotten_password.js').sequelize;
var moment                = require('moment');
var paths                 = require(__dirname + '/../paths.js');
var generateOTP = function(){
  return notp.totp.gen(this.otp_key);
};

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
      'login_counter'
    ].concat(extraFields)
  });
};

resolveUser = function(user, defer){
  if (user === null) {
    logger.debug('USER NOT FOUND');
    return defer.reject();
  }

  var val = user.dataValues;
  delete val.password;
  val.generateOTP = generateOTP;
  val.sendOTP = sendOTP;
  val.sendPasswordResetToken = sendPasswordResetToken;
  val.toggleDisabled= toggleDisabled;
  val.updateUserNameAndEmail = (email, userName)=> { return updateUserNameAndEmail(user, email, userName) };
  val.updatePassword = (password)=> { return updatePassword(user, password) };
  val.incrementLoginCount = ()=> { return incrementLoginCount(user); };
  val.resetLoginCount = ()=> { return resetLoginCount(user); };
  val.setRole = (role)=> { return setRole(role, user); };
  val.hasPermission = (permissionName)=> { return hasPermission(permissionName, user); };
  val.logOut = logOut;
  val.user = user;
  defer.resolve(val);
};

var sendForgottenPasswordEmail = function(user, code, correlationId, defer) {
  template  = process.env.NOTIFY_FORGOTTEN_PASSWORD_EMAIL_TEMPLATE_ID;
  var uri = paths.generateRoute(paths.user.forgottenPasswordReset,{id: code});
  var url = process.env.SELFSERVICE_BASE + uri;
  var startTime = new Date();
  notify.sendEmail(template, user.email, { code: url })
    .then(()=>{
      logger.info(`[${correlationId}] - GET to %s ended - elapsed time: %s ms`, url,  new Date() - startTime);
      logger.info(`[${correlationId}] FORGOTTEN PASSWORD EMAIL SENT TO USER ID: ` + user.id);
      defer.resolve();
    }, (e)=> {
      logger.info(`[${correlationId}] - GET to %s ended - elapsed time: %s ms`, url,  new Date() - startTime);
      logger.error(`[${correlationId}] PROBLEM SENDING FORGOTTEN PASSWORD EMAIL `,e);
      defer.reject();
    });
};


module.exports = {
  sendOTP: function (user) {
    var template = process.env.NOTIFY_2FA_TEMPLATE_ID;
    if (user.otp_key && user.telephone_number && template) {
      var code = this.generateOTP();
      return notify.sendSms(template, user.telephone_number, {code: code});
    } else {
      throw new Error('missing required field to send text');
    }
  },

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

  findByUsername: function (username, correlationId) {
    correlationId = correlationId || '';
    var defer = q.defer();

    _find(undefined, ['password'], {username: username}).then(
      (user)=> resolveUser(user, defer),
      (e)=> {
        logger.debug(`[${correlationId}] find user by email - not found`);
        defer.reject(e);
      }
    );
    return defer.promise;
  },


  /**
   * @param {String} permissionName name of permission
   * @param {User} user instance to check if is associated to a role with the given permissionName
   *
   * User is associated to a single role and this role must be populated, it cannot happen to exist any
   * user not belonging to a single role (at least for now).
   */
  hasPermission: function (permissionName, user) {
    return user.getRoles()
      .then((roles)=> roles[0]
          .getPermissions({where: {name: permissionName}}).then((permissions)=>
          permissions.length !== 0,
          (e)=> logger.error('Error retrieving permissions of an user', e)),
        (e)=> logger.error('Error retrieving role of user', e)
      );
  },

  updateOtpKey: function (user, email, otpKey) {
    var defer = q.defer();

    if (!user) return defer.reject();
    user.updateAttributes({otp_key: otpKey})
      .then(defer.resolve, (err)=> {
        defer.reject();
        logger.error('OTP UPDATE ERROR', err);
      });

    return defer.promise;
  },

  findByResetToken: function (code) {
    var defer = q.defer(),
      params = {where: {code: code}};

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
      .then((user)=> resolveUser(user, defer))
      .catch(defer.reject);

    return defer.promise;
  },


  create: function (userData, role) {
    var defer = q.defer(),
      savedUser,
      _user = {
        username: userData.username,
        password: userData.password,
        gateway_account_id: userData.gateway_account_id,
        email: userData.email.toLowerCase(),
        telephone_number: userData.telephone_number,
        otp_key: userData.otp_key ? user.otp_key : random.key(10)
      };
    if (!role) defer.reject();
    User.create(_user)
      .then((user)=> savedUser = user)
      .then(()=> savedUser.setRoles([role]))
      .then(()=> resolveUser(savedUser, defer), defer.reject);

    return defer.promise;
  },


  authenticate: function (user, submittedPassword) {
    var defer = q.defer();

    if (!user) {
      return defer.reject();
    }

    if (!bcrypt.compareSync(submittedPassword, user.password)) {
      return defer.reject();
    }

    resolveUser(user, defer);

    return defer.promise;
  },


  logOut: function (user) {
    var defer = q.defer();
    sequelizeConnection.query('delete from "Sessions" where data LIKE :username ',
      {replacements: {username: `%"user":"${user.username}"%`}, type: Sequelize.QueryTypes.DELETE}
    ).then(defer.resolve, defer.reject);

    return defer.promise
  }
};