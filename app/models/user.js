var sequelizeConfig = require('../utils/sequelize_config.js');
var sequelizeConnection = sequelizeConfig.sequelize;
var Sequelize = require('sequelize');
var bcrypt = require('bcrypt');
var q = require('q');
var _ = require('lodash');
var notify = require('../services/notification_client.js');
var notp = require('notp');
var random = require('../utils/random.js');
var logger = require('winston');



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

// creates table if it does not exist
sequelizeConnection.sync();

var _find = function(email, extraFields = []) {
  return User.findOne({
    where: { email: email },
    attributes:['username', 'email', 'gateway_account_id', 'otp_key', 'id','telephone_number'].concat(extraFields)
  });
},

sendOTP = function(){
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

resolveUser = function(user, defer){
  delete user.dataValues.password;
  user.dataValues.generateOTP = generateOTP;
  user.dataValues.sendOTP = sendOTP;
  defer.resolve(user.dataValues);
};

var find = function(email) {
  var defer = q.defer();
  _find(email).then((user)=> resolveUser(user, defer));
  return defer.promise;

};



var create = function(user){
  var defer = q.defer();
  User.create({
    username: user.username,
    password: bcrypt.hashSync(user.password, 10),
    gateway_account_id: user.gateway_account_id,
    email: user.email,
    telephone_number: user.telephone_number,
    otp_key: user.otp_key ? user.otp_key : random.key(10)
  }).then((user)=> resolveUser(user, defer));
  return defer.promise;
};

var authenticate = function(email,password) {
  var defer = q.defer();
  _find(email,['password']).then(function(user){
    if (!user) return defer.reject();
    var data = user.dataValues;
    validPass = bcrypt.compareSync(password,data.password);

    if (validPass) resolveUser(user, defer);
    defer.reject();
  });
  return defer.promise;
};

var updateOtpKey = function(email,otpKey){
  var defer = q.defer();
  _find(email).then(function(user){
    if (!user) return defer.reject();
    user.updateAttributes({otp_key: otpKey}).then(function(user){
      defer.resolve();
    },function(err){
      defer.reject();
      logger.info('OTP UPDATE ERROR',err,otpKey);
    });
  });
  return defer.promise;
};


module.exports = {
  find: find,
  create: create,
  authenticate: authenticate,
  updateOtpKey: updateOtpKey
};
