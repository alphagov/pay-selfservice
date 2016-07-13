var sequelizeConfig = require('../utils/sequelize_config.js');
var sequelizeConnection = sequelizeConfig.sequelize;
var Sequelize = require('sequelize');
var bcrypt = require('bcrypt');
var q = require('q');

var User = sequelizeConnection.define('user', {
  username: Sequelize.STRING,
  password: Sequelize.STRING,
  email: Sequelize.STRING,
  account_id: Sequelize.STRING,
  key: Sequelize.STRING
});

sequelizeConnection.sync();


var find = function(email, extraFields = []) {
  return User.findOne({
    where: { email: email },
    attributes:['username', 'email', 'account_id', 'key', 'id'].concat(extraFields)
  });
};

var create = function(user){
  return User.create({
    username: user.username,
    password: bcrypt.hashSync(user.password, 10),
    account_id: user.account_id,
    email: user.email
  });
};

var authenticate = function(email,password) {
  var defer = q.defer();
  console.log('EMAIL',email);
  find(email,['password']).then(function(user){
    var data = user.dataValues;
    validPass = bcrypt.compareSync(password,data.password);
    delete data.password;
    if (validPass) defer.resolve(data);
    defer.reject();
  });
  return defer.promise;
};

var updateTotpKey = function(email,totpKey){
  var defer = q.defer();
  return find(email).then(function(user){
    user.updateAttributes({key: totpKey}).then(function(user){
      defer.resolve();
    },function(err){ console.log('err',err,totpKey);});
  });
  return defer.promise;
};

module.exports = {
  find: find,
  create: create,
  authenticate: authenticate,
  updateTotpKey: updateTotpKey
};






