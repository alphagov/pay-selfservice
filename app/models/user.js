var sequelizeConfig = require('../utils/sequelize_config.js');
var sequelizeConnection = sequelizeConfig.sequelize;
var Sequelize = require('sequelize');
var bcrypt = require('bcrypt');
var q = require('q');
var _ = require('lodash');


var User = sequelizeConnection.define('user', {
  username: Sequelize.STRING,
  password: Sequelize.STRING,
  email: Sequelize.STRING,
  gateway_account_id: Sequelize.STRING,
  otp_key: Sequelize.STRING
});

// creates table if it does not exist
sequelizeConnection.sync();

var _find = function(email, extraFields = []) {
  return User.findOne({
    where: { email: email },
    attributes:['username', 'email', 'gateway_account_id', 'otp_key', 'id'].concat(extraFields)
  });

};


var find = function(email) {
  var defer = q.defer();
  _find(email).then(function(user){
    defer.resolve(user.dataValues);
  });
  return defer.promise;

};

var create = function(user){
  var defer = q.defer();
  User.create({
    username: user.username,
    password: bcrypt.hashSync(user.password, 10),
    gateway_account_id: user.gateway_account_id,
    email: user.email
  }).then(function(user){
    delete user.dataValues.password;
    defer.resolve(user.dataValues);
  });
  return defer.promise;
};

var authenticate = function(email,password) {
  var defer = q.defer();
  _find(email,['password']).then(function(user){
    if (!user) return defer.reject();
    var data = user.dataValues;
    validPass = bcrypt.compareSync(password,data.password);
    delete data.password;
    if (validPass) defer.resolve(data);
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
      console.log('OTP UPDATE ERROR',err,otpKey);
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
