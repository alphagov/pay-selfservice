var sequelizeConfig       = require('./../utils/sequelize_config.js');
var sequelizeConnection   = sequelizeConfig.sequelize;
var Sequelize             = require('sequelize');
var bcrypt                = require('bcrypt');
var q                     = require('q');
var _                     = require('lodash');
var notp                  = require('notp');
var logger                = require('winston');
var forgottenPassword     = require('./forgotten_password.js').sequelize;
var Role                  = require('./role.js').sequelize;
var UserRole              = require('./user_role.js').sequelize;
var moment                = require('moment');
var paths                 = require(__dirname + '/../paths.js');
var commonPassword        = require('common-password');

const MIN_PASSWORD_LENGTH       = 10;
const HASH_PASSWORD_SALT_ROUNDS = 10;

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
      notEmpty: true,
      isValid: function(value, next){
        if (commonPassword(value)) {
          return next('Your password is too simple. Choose a password that is harder for people to guess.');
        }

        if ( value.length < MIN_PASSWORD_LENGTH) {
          return next("Your password must be at least 10 characters.")
        }
        next();
      }
    },
  },
  email: {
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
  },
  disabled: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  login_counter: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
});

User.hasMany(forgottenPassword, {as: 'forgotten'});
User.belongsToMany(Role, { as: 'roles', through: UserRole, foreignKey:'user_id', otherKey:'role_id'});
User.sequelize.sync();

var hashPasswordHook = function(instance) {
  if (!instance.changed('password')) return;
  var hash = bcrypt.hashSync(instance.get('password'), HASH_PASSWORD_SALT_ROUNDS);
  instance.set('password', hash);
};

User.beforeCreate(hashPasswordHook);
User.beforeUpdate(hashPasswordHook);

// console.log('user = ' + JSON.stringify(User.Instance.prototype));

User.Instance.prototype.toggleDisabled = function(toggle) {
  var defer = q.defer(),
  log = ()=> logger.info(this.id + " disabled status is now " + toggle);
  var update = { disabled: toggle };
  if (toggle == false) update.login_counter = 0;
  User.update(
    update,
    { where: { id : this.id } }
  )
  .then(
    ()=>{ log(); defer.resolve();},
    ()=>{ log(); defer.reject();});
  return defer.promise;
};

User.Instance.prototype.updatePassword = function(password){
  var defer = q.defer();
  this.password = password;
  this.save().then(defer.resolve,defer.reject);
  return defer.promise;
};

User.Instance.prototype.incrementLoginCount = function(user){
  var defer = q.defer();
  this.login_counter = this.login_counter + 1
  this.save().then(defer.resolve,defer.reject);
  return defer.promise;
};

  User.Instance.prototype.resetLoginCount = function(user){
  var defer = q.defer();
  this.login_counter = 0
  this.save().then(defer.resolve,defer.reject);
  return defer.promise;
};

User.Instance.prototype.updateUserNameAndEmail = function(newEmail, newUserName) {
  var defer = q.defer();
  if(newEmail && newEmail !='') {
    this.email    = newEmail;
  }
  if (newUserName || newUserName != '') {
    this.username = newUserName;
  }
  this.save().then(defer.resolve, defer.reject);
  return defer.promise;
};

/**
 * @param {Role} role instance and also accept {Integer} primary key of a Role
 * @param {User} user to set the given role
 *
 * Set given role to a user overriding its current one
 */
User.Instance.prototype.setRole = function(role) {
  return user.setRoles([role]);
};


module.exports = {
  User: User
};
