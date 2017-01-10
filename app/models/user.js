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

var hashPasswordHook = function(instance) {
  if (!instance.changed('password')) return;
  var hash = bcrypt.hashSync(instance.get('password'), HASH_PASSWORD_SALT_ROUNDS);
  instance.set('password', hash);
};

User.beforeCreate(hashPasswordHook);
User.beforeUpdate(hashPasswordHook);



/**
 * @param {boolean} toggle
 * @returns {Promise}
 */
User.Instance.prototype.toJSON = function(toggle) {
  var values = Object.assign({}, this.get());

  delete values.password;
  return values;
};

/**
 * @param {boolean} toggle
 * @returns {Promise}
 */
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

/**
 * @param {string} password
 * @returns {Promise}
 */
User.Instance.prototype.updatePassword = function(password) {
  this.password = password;
  return this.save();
};

/**
 * @returns {Promise}
 */
User.Instance.prototype.incrementLoginCount = function(){
  this.login_counter = this.login_counter + 1;
  return this.save();
};

/**
 * @returns {Promise}
 */
User.Instance.prototype.resetLoginCount = function(){
  this.login_counter = 0;
  return this.save();
};

/**
 * @param {string} newEmail
 * @param {string} newUserName
 * @returns {Promise}
 */
User.Instance.prototype.updateUserNameAndEmail = function(newEmail, newUserName) {
  if(newEmail && newEmail !='') {
    this.email    = newEmail;
  }
  if (newUserName || newUserName != '') {
    this.username = newUserName;
  }

  return this.save();
};

/**
 * @returns {String}
 */
User.Instance.prototype.generateOTP = function() {
  return notp.totp.gen(this.otp_key);
};

/**
 * @param {Role} role instance and also accept {Integer} primary key of a Role
 * @param {User} user to set the given role
 *
 * Set given role to a user overriding its current one
 */
User.Instance.prototype.setRole = function(role) {
  let roleId;
  if (typeof role === 'number' || typeof role === 'string') {
    roleId = role;
  } else {
    roleId = role.id;
  }
  return this.setRoles([roleId]);
};

User.sequelize.sync();

module.exports = {
  User: User
};
