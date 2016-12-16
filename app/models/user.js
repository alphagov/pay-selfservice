var sequelizeConfig       = require('./../utils/sequelize_config.js');
var sequelizeConnection   = sequelizeConfig.sequelize;
var Sequelize             = require('sequelize');
var bcrypt                = require('bcrypt');
var q                     = require('q');
var _                     = require('lodash');
var notify                = require('../services/notification_client.js');
var notp                  = require('notp');
var random                = require('../utils/random.js');
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

var sendOTP = function(){
  var template = process.env.NOTIFY_2FA_TEMPLATE_ID;
    if (this.otp_key && this.telephone_number && template) {
      var code = this.generateOTP();
      return notify.sendSms(template, this.telephone_number, { code: code });
    } else {
      throw new Error('missing required field to send text');
    }
},

generateOTP = function(){
   return notp.totp.gen(this.otp_key);
},

toggleDisabled = function(toggle) {
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
},


sendPasswordResetToken = function(correlationId){
  var defer = q.defer(),
  code      = random.key(20),
  template  = process.env.NOTIFY_FORGOTTEN_PASSWORD_EMAIL_TEMPLATE_ID,
  user      = this,
  data      = { date: Date.now(), code: code, userId: this.id },

  init = function(){
    forgottenPassword.create(data).then(sendEmail,()=> {
      logger.warn(`[${correlationId}] PROBLEM CREATING FORGOTTEN PASSWORD. User: `, data.userId);
      defer.reject();
    });
  },

  sendEmail = (forgotten)=> {
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
  init();
  return defer.promise;
},

updatePassword = function(user, password){
  var defer = q.defer();
  user.password = password;
  user.save().then(defer.resolve,defer.reject);
  return defer.promise;
},

incrementLoginCount = function(user){
  var defer = q.defer();
  user.login_counter = user.login_counter + 1;
  this.login_counter = this.login_counter + 1
  user.save().then(defer.resolve,defer.reject);
  return defer.promise;
},

resetLoginCount = function(user){
  var defer = q.defer();
  user.login_counter = 0
  user.save().then(defer.resolve,defer.reject);
  return defer.promise;
},

logOut = function(){
  var defer = q.defer();
  sequelizeConnection.query('delete from "Sessions" where data LIKE :username ',
    { replacements: { username: `%${this.username}%`  }, type: Sequelize.QueryTypes.DELETE }
  ).then(
    ()=> { defer.resolve() },
    ()=> { defer.reject() }

  );
  return defer.promise
},

updateUserNameAndEmail = function(user, newEmail, newUserName) {
  var defer = q.defer();
  if(newEmail && newEmail !='') {
    user.email    = newEmail;
  }
  if (newUserName || newUserName != '') {
    user.username = newUserName;
  }
  user.save().then(defer.resolve,defer.reject);
  return defer.promise;
},

  /**
   * @param {Role} role instance and also accept {Integer} primary key of a Role
   * @param {User} user to set the given role
   *
   * Set given role to a user overriding its current one
   */
setRole = function(role, user) {
  return user.setRoles([role]);
},

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

// CLASS

findByUsername = function(username, correlationId) {
  correlationId = correlationId || '';
  var defer = q.defer();

  _find(undefined,['password'],{username: username}).then(
      (user)=> resolveUser(user, defer),
      (e)=> { logger.debug(`[${correlationId}] find user by email - not found`); defer.reject(e);}
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
hasPermission = function (permissionName, user) {
  return user.getRoles()
    .then((roles)=> roles[0]
      .getPermissions({where: {name: permissionName}}).then((permissions)=>
        permissions.length !== 0,
        (e)=> logger.error('Error retrieving permissions of an user',e)),
      (e)=> logger.error('Error retrieving role of user', e)
    );
},

create = function(user, role) {
  var defer = q.defer(),
   savedUser,
  _user = {
    username: user.username,
    password: user.password,
    gateway_account_id: user.gateway_account_id,
    email: user.email.toLowerCase(),
    telephone_number: user.telephone_number,
    otp_key: user.otp_key ? user.otp_key : random.key(10)
  };
  if(!role) defer.reject();
  User.create(_user)
    .then((user)=> savedUser = user)
    .then(()=> savedUser.setRoles([role]))
    .then(()=> resolveUser(savedUser, defer), defer.reject);

  return defer.promise;
},

authenticate = function(username,password) {
  var defer = q.defer();

  init = function(){
    _find(undefined,['password'],{username: username}).then(authentic, defer.reject)
  };

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
};

// PRIVATE
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

module.exports = {
  findByUsername: findByUsername,
  create: create,
  authenticate: authenticate,
  updateOtpKey: updateOtpKey,
  sequelize: User,
  findByResetToken: findByResetToken,
};
