var sequelizeConfig = require('./../utils/sequelize_config.js');
var sequelizeConnection = sequelizeConfig.sequelize;
var Sequelize = require('sequelize');
var bcrypt = require('bcrypt');
var q = require('q');
var _ = require('lodash');
var notify = require('../services/notification_client.js');
var notp = require('notp');
var random = require('../utils/random.js');
var logger = require('winston');
var forgottenPassword = require('./forgotten_password.js').sequelize;
var moment = require('moment');
var paths = require(__dirname + '/../paths.js');
var INVALID_PASSWORD = "Password must be at least 10 characters";

var User = sequelizeConnection.define('user', {
  username: {
    unique: true,
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    },
  },
  email: {
    unique: true,
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    },
  },
  gateway_account_id: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    },
  },
  otp_key: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    },
  },
  telephone_number: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    },
  }
});
User.hasMany(forgottenPassword, {as: 'forgotten'});

// INSTANCE

var sendOTP = function(){
  var template = process.env.NOTIFY_2FA_TEMPLATE_ID;

  if (!(this.otp_key && this.telephone_number && template)) {
    throw new Error('missing required field to send text');
  }
  var code = this.generateOTP();
  return notify.sendSms(template, this.telephone_number, { code: code });
},

generateOTP = function(){
   return notp.totp.gen(this.otp_key);
},


sendPasswordResetToken = function(){
  var defer = q.defer(),
  code      = random.key(20),
  template  = process.env.NOTIFY_FORGOTTEN_PASSWORD_EMAIL_TEMPLATE_ID,
  user      = this,
  data      = { date: Date.now(), code: code, userId: this.id },

  init = function(){
    forgottenPassword.create(data).then(sendEmail,()=> {
      logger.warn('PROBLEM CREATING FORGOTTEN PASSWORD', data);
      defer.reject();
    });
  },

  sendEmail = (forgotten)=> {
    var uri = paths.generateRoute(paths.user.forgottenPasswordReset,{id: code});
    var url = process.env.SELFSERVICE_BASE + uri;
    var startTime = new Date();
    notify.sendEmail(template, user.email, { code: url })
    .then(()=>{
      logger.info("[] - GET to %s ended - elapsed time: %s ms", url,  new Date() - startTime);
      logger.info('FORGOTTEN PASSWORD EMAIL SENT TO USER ID:-' + user.id);
      defer.resolve();
    }, (e)=> {
      logger.info("[] - GET to %s ended - elapsed time: %s ms", url,  new Date() - startTime);
      logger.error('PROBLEM SENDING FORGOTTEN PASSWORD EMAIL ',e);
      defer.reject();
    });
  };
  init();
  return defer.promise;
},

updatePassword = function(password){
  var defer = q.defer(),
  hashedPassword = hashValidPassword(password);
  if (hashedPassword) {
    User.update(
      { password: hashedPassword },
      { where: { id : this.id } }
    )
    .then(()=>{
      deleteSession(this.email);
      defer.resolve();
    },
    defer.reject);
  } else {
    defer.reject(INVALID_PASSWORD)
  }
  return defer.promise;
},

resolveUser = function(user, defer, email){
  if (user === null) {
    logger.debug('USER NOT FOUND ' + email);
    return defer.reject();
  }
  var val = user.dataValues;
  delete val.password;
  val.generateOTP = generateOTP;
  val.sendOTP = sendOTP;
  val.sendPasswordResetToken = sendPasswordResetToken;
  val.updatePassword = updatePassword;
  defer.resolve(val);
};

// CLASS

var find = function(email) {
  var defer = q.defer();
  _find(email).then(
    (user)=> resolveUser(user, defer,email),
    (e)=> { logger.debug(email + " user not found"); defer.reject(e);});
  return defer.promise;
},

create = function(user){
  var defer = q.defer(),
  hashedPassword = hashValidPassword(user.password);
  if (hashedPassword) {
    var _user = {
      username: user.username,
      password: hashedPassword,
      gateway_account_id: user.gateway_account_id,
      email: user.email.toLowerCase(),
      telephone_number: user.telephone_number,
      otp_key: user.otp_key ? user.otp_key : random.key(10)
    };

    User.create(_user).then((user)=> resolveUser(user, defer));
  } else {
    defer.reject(INVALID_PASSWORD);
  }
  return defer.promise;
},

authenticate = function(email,password) {
  var defer = q.defer(),

  init = function(){
    _find(email,['password']).then(authentic, defer.reject);
  },

  authentic = function(user){
    if (!user) return defer.reject();
    var data = user.dataValues;
    validPass = bcrypt.compareSync(password,data.password);

    if (validPass) resolveUser(user, defer);
    defer.reject();
  };

  init();
  return defer.promise;
},

updateOtpKey = function(email,otpKey){
  var defer = q.defer(),

  init = function(){
    _find(email).then(update, error);

  },
  error = (err)=> {
    defer.reject();
    logger.error('OTP UPDATE ERROR',err);
  },

  update = function(user){
    if (!user) return defer.reject();
    user.updateAttributes({otp_key: otpKey})
      .then(defer.resolve, error);
  };
  init();
  return defer.promise;
},

findByResetToken = function(code){
  var defer = q.defer(),
  params    = { where: { code: code }},

  init = function(){
    forgottenPassword.findOne(params).then(foundToken, defer.reject);
  },

  foundToken = (forgotten)=> {
    if (forgotten === null) return defer.reject();
    var current = moment(Date.now()),
    created     = moment(forgotten.date),
    duration    = Math.ceil(moment.duration(current.diff(created)).asMinutes()),
    timedOut    = duration > parseInt(process.env.FORGOTTEN_PASSWORD_EXPIRY_MINUTES),
    notfound    = forgotten === null;
    if (notfound || timedOut) return defer.reject();
    _find(undefined,[],{id : forgotten.userId})
      .then(foundUser, defer.reject);
  },

  foundUser = (user)=> resolveUser(user, defer);

  init();
  return defer.promise;
},

deleteSession = function (userEmail) {
  var defer = q.defer();
  var checkUserQuery = 'delete from "Sessions" where data like \'%\' || \'"passport":{"user":"' + userEmail + '"}\' || \'%\'';
  sequelizeConnection.query(checkUserQuery)
  .then(()=> {
    console.log('deleted session');
    defer.resolve();
  },(e)=> {
    console.log('could not delete session:- ' + e);
    defer.reject();
  });
  return defer.promise;
};

// PRIVATE

var _find = function(email, extraFields = [], where) {
  if (!where) where = { email: email };
  if (where.email) where.email = where.email.toLowerCase();
  return User.findOne({
    where: where,
    attributes:['username', 'email', 'gateway_account_id', 'otp_key', 'id','telephone_number'].concat(extraFields)
  });
},

  hashValidPassword = function (password) {
    var invalidPassword = password.length < 10;
    return (invalidPassword) ? false : bcrypt.hashSync(password, 10);
  };

module.exports = {
  find: find,
  create: create,
  authenticate: authenticate,
  updateOtpKey: updateOtpKey,
  sequelize: User,
  findByResetToken: findByResetToken,
  deleteSession: deleteSession
};



