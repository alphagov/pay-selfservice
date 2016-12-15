var expect = require('chai').expect;
var proxyquire = require('proxyquire');
var _ = require('lodash');
var Sequelize = require('sequelize');

var defaultOtpKey = '123456789';
var defaultPassword = 'password10';
var defaultForgottenPasswordCode = 'xyz';

process.env.FORGOTTEN_PASSWORD_EXPIRY_MINUTES = 90;

var mockedNotificationClient = {
  sendEmail: function (template, email, data) {
    expect(template).to.be.equal("template_id");
    expect(email).to.be.equal(defaultUser.email.toLowerCase());
    expect(data.code.indexOf('https://selfservice.pymnt.localdomain/reset-password/')).to.be.equal(0);
    expect(data.code.length).to.be.equal(62);

    return {
      then: function (cb) {
        cb()
      }
    }
  }
};

var testSequelizeConfig = require(__dirname + '/../../test_helpers/test_sequelize_config.js');

var ForgottenPassword = proxyquire(__dirname + '/../../../app/models/forgotten_password.js', {
  '../utils/sequelize_config.js': testSequelizeConfig
});

var Permission = proxyquire(__dirname + '/../../../app/models/permission.js', {
  '../utils/sequelize_config.js': testSequelizeConfig
});

var RolePermission = proxyquire(__dirname + '/../../../app/models/role_permission.js', {
  '../utils/sequelize_config.js': testSequelizeConfig
});

var Role = proxyquire(__dirname + '/../../../app/models/role.js', {
  './permission.js': Permission,
  './role_permission.js': RolePermission,
  '../utils/sequelize_config.js': testSequelizeConfig
});

var UserRole = proxyquire(__dirname + '/../../../app/models/user_role.js', {
  '../utils/sequelize_config.js': testSequelizeConfig
});

var User = proxyquire(__dirname + '/../../../app/models/user.js', {
  './../utils/sequelize_config.js': testSequelizeConfig,
  './forgotten_password.js': ForgottenPassword,
  './role.js': Role,
  './user_role.js': UserRole,
  '../services/notification_client.js': mockedNotificationClient
});

var userService = proxyquire(__dirname + '/../../../app/services/user_service.js', {
  '../utils/random.js': {key: () => defaultOtpKey},
  './../utils/sequelize_config.js': testSequelizeConfig,
  './../models/user.js': User,
  './forgotten_password.js': ForgottenPassword,
  '../services/notification_client.js': mockedNotificationClient
});

var wrongPromise = function (done) {
  return (reason) => {
    var error = new Error('Promise was unexpectedly fulfilled. Error: ', reason);
    console.log('Reason => ', reason);
    try {
      if (typeof done === 'function') done(error);

    } catch(e) {
      console.log(e);
    }
  }
};

var defaultRole = {
  name: "Default Role",
  description: "Default Role"
};

var defaultUser = {
  password: defaultPassword,
  gateway_account_id: 1,
  telephone_number: "1"
};

var createDefaultUser = function (extendedAttributes) {
  defaultUser.username = Math.random().toString(36).substring(7);
  defaultUser.email = Math.random().toString(36).substring(7) + "@email.com";

  var userAttributes = _.extend({}, defaultUser, extendedAttributes);
  var permissionDef;
  var roleDef;
  return Permission.sequelize.create({name: Math.random().toString(36).substring(7), description: "Permission"})
    .then((permission)=> permissionDef = permission)
    .then(()=> Role.sequelize.create(defaultRole))
    .then((role)=> roleDef = role)
    .then(()=> roleDef.setPermissions([permissionDef]))
    .then(()=> userService.create(userAttributes, roleDef));
};

var createDefaultForgottenPassword = function (extendedAttributes) {
  var forgottenPasswordAttributes = _.extend({
    date: Date.now(),
    code: defaultForgottenPasswordCode
  }, extendedAttributes);
  return ForgottenPassword.sequelize.create(forgottenPasswordAttributes);
};

var createPermission = function (attributes) {
  Permission.sequelize.sync();
  return Permission.sequelize.create(attributes);
};

var createRole = function (attributes) {
  Role.sequelize.sync();
  return Role.sequelize.create(attributes);
};

var yesterdayDate = () => {
  var date = new Date();
  date.setDate(date.getDate() - 1);
  return date;
};

var Sessions = testSequelizeConfig.sequelize.define('Sessions', {data: {type: Sequelize.STRING}});

var sync_db = () => {
  return ForgottenPassword.sequelize.sync({force: true})
    .then(() => Sessions.sync({force: true}))
    .then(() => Permission.sequelize.sync({force: true}))
    .then(() => Role.sequelize.sync({force: true}))
    .then(() => RolePermission.sequelize.sync({force: true}))
    .then(() => User.User.sync({force: true}))
    .then(() => UserRole.sequelize.sync({force: true}));
};

describe('user model', function () {

  before((done) => {
    sync_db()
      .then(() => done());
  });

  beforeEach(function (done) {
    this.timeout(5000);

    sync_db()
      .then(() => done());
  });

  describe('find', function () {

    it('should return a user by username', function (done) {
      createDefaultUser({username: 'foo'}).then(() => {
        userService.findByUsername("foo").then(() => done(),wrongPromise(done));
      })
    });

    it('should not show password when rendered', function (done) {
      createDefaultUser().then(() => {
        userService.findByUsername(defaultUser.username).then((user) => {
          expect(user.toJSON()).to.not.have.property('password');
          done();
        }, wrongPromise(done));
      })
    });
  });

  describe('create', function () {
    beforeEach(function (done) {
      sync_db()
        .then(() => done());
    });

    it('should create a user and lowercase email', function (done) {
      var userAttributes = {
        username: "foo",
        password: "password10",
        gateway_account_id: "1",
        email: "Foo@example.com",
        telephone_number: "1"
      };
      createRole({description: "Admin"})
        .then((role)=> userService.create(userAttributes, role))
        .then((user) => expect(user.email).equal(userAttributes.email.toLowerCase()))
        .then(()=> userService.findByUsername(userAttributes.username))
        .then((user) => {
          expect(user.username).equal(userAttributes.username);
          expect(user.gateway_account_id).equal(userAttributes.gateway_account_id);
          expect(user.email).equal(userAttributes.email.toLowerCase());
          expect(user.telephone_number).equal(userAttributes.telephone_number);
        }).then(()=> done())
        .catch(wrongPromise(done));
    });

    it('should create a user with a specific otp_key and encrypts password', function (done) {
      createDefaultUser().then(user => {
        userService.findByUsername(user.username).then(user => {
          expect(user.dataValues.otp_key).to.equal(defaultOtpKey);
          done();
        }, wrongPromise(done));
      }, wrongPromise(done));
    });

    it('should be able to create two users with same email', function (done) {
      createDefaultUser({email: "meh@example.com"})
        .then(createDefaultUser({email: "meh@example.com" }))
        .then(() => done())
        .catch(wrongPromise(done));
    });
  });

  describe('authenticate', function () {
    it('should authenticate a valid user', function (done) {
      createDefaultUser().then(user => {
        userService.authenticate(user.username, defaultPassword).then(() => done(), wrongPromise(done))
      }, wrongPromise(done));
    });

    it('should not authenticate an invalid user', function (done) {
      createDefaultUser().then(user => {
        userService.authenticate(user.username, "wrongPassword").then(wrongPromise(done), () => done())
      }, wrongPromise(done));
    });
  });

  describe('updateOtpKey', function () {
    it('should update the otp key', function (done) {
      createDefaultUser().then(user => {
        userService.updateOtpKey(user, "123").then(user => {
          expect(user.dataValues.otp_key).equal("123");
          done();
        })
      })
      .catch(wrongPromise(done));
    });
  });

  describe('sendPasswordResetToken', function () {
    it('should send an email', function (done) {
      createDefaultUser().then(user => {
        userService.findByUsername(user.username).then(user => {
          userService.sendPasswordResetToken(user, 'some-correlation-id');
          done();
        }, wrongPromise(done));
      }, wrongPromise(done));
    });
  });

  describe('updatePassword', function () {
    it('should update the password', function (done) {
      var createdUser;
      createDefaultUser()
        .then(user => createdUser = user)
        .then(() => createdUser.updatePassword("newPassword"))
        .then(() => userService.findByUsername(createdUser.username))
        .then((foundUser) => userService.authenticate(foundUser.username, "newPassword"))
        .then(() => done())
    });
  });

  describe('updateUserNameAndEmail', function () {
    it('should update the username and email', function (done) {
      createDefaultUser().then(user => {
        user.updateUserNameAndEmail('hi@bye.com', 'hibye')
          .then((user)=> {
              expect(user.username).equal('hibye');
              expect(user.email).equal('hi@bye.com');
              done()
            }

            , wrongPromise(done));
      }, wrongPromise(done));
    });

    it('should not update the username if new username is empty', function (done) {
      createDefaultUser().then(user => {
        user.updateUserNameAndEmail('hi@bye.com', '')
          .then((user)=> {
              expect(user.username).equal(defaultUser.username);
              expect(user.email).equal('hi@bye.com');
              done()
            }

            , wrongPromise(done));
      }, wrongPromise(done));
    });

    it('should not update the email if new email is empty', function (done) {
      createDefaultUser().then(user => {
        user.updateUserNameAndEmail('', 'hibye')
          .then((user)=> {
              expect(user.username).equal('hibye');
              expect(user.email).equal(defaultUser.email);
              done()
            }

            , wrongPromise(done));
      }, wrongPromise(done));
    });
  });

  describe('findByResetToken', function () {
    it('should fail when forgotten password token is unknown', function (done) {
      userService.findByResetToken("unknownCode").then(wrongPromise(done), () => done());
    });

    it('should fail when forgotten password token has expired', function (done) {
      createDefaultUser().then(user => {
        createDefaultForgottenPassword({date: yesterdayDate(), userId: user.id}).then(() => {
          userService.findByResetToken(defaultForgottenPasswordCode).then(wrongPromise(done), () => done());
        }, wrongPromise(done));
      }, wrongPromise(done));
    });

    it('should find the forgotten password token', function (done) {
      this.timeout(5000);
      createDefaultUser().then(user => {
        createDefaultForgottenPassword({userId: user.id}).then(() => {
          userService.findByResetToken(defaultForgottenPasswordCode).then(() => {
            expect(user.username).equal(defaultUser.username);
            expect(user.gateway_account_id).equal(defaultUser.gateway_account_id);
            expect(user.email).equal(defaultUser.email.toLowerCase());
            expect(user.telephone_number).equal(defaultUser.telephone_number);
            done();
          }, wrongPromise(done));
        }, wrongPromise(done));
      }, wrongPromise(done));
    });
  });

  describe('logout', function () {
    it('should increment session version', function (done) {
      this.timeout(5000);
      var createdUser;
      createDefaultUser()
        .then((user) => {
          createdUser = user
        })
        .then(() => expect(createdUser.session_version).to.equal(0))
        .then(() => userService.logOut(createdUser))
        .then(() => expect(createdUser.session_version).to.equal(1))
        .then(() => done())
        .catch(wrongPromise(done));
    });
  });

  describe('toggle user', function () {
    it('should be able to disable the user', function (done) {
      var createdUser;
      createDefaultUser({disabled: false})
        .then((user) => createdUser = user)
        .then(() => userService.findByUsername(createdUser.username))
        .then((user) => user.toggleDisabled(true))
        .then(() => userService.findByUsername(createdUser.username))
        .then((updatedUser) => expect(updatedUser.disabled).to.be.true)
        .then(()=> done())
        .catch(wrongPromise(done));
    });

    it('should be able to enable the user', function (done) {
      var createdUser;
      createDefaultUser()
        .then(user => createdUser = user)
        .then(() => userService.findByUsername(createdUser.username))
        .then((user) => user.toggleDisabled(true))
        .then(() => userService.findByUsername(createdUser.username))
        .then((user) => user.toggleDisabled(false))
        .then(() => userService.findByUsername(createdUser.username))
        .then((updatedUser) => {
          expect(updatedUser.disabled).to.be.false;
          expect(updatedUser.login_counter).to.be.equal(0);
        }).then(()=> done())
        .catch(wrongPromise(done));
    });
  });

  describe('login count', function () {
    it('should increment the login count', function (done) {
      var createdUser;
      createDefaultUser()
        .then(user => createdUser = user)
        .then(() => userService.findByUsername(createdUser.username))
        .then((user) => user.incrementLoginCount())
        .then(() => userService.findByUsername(createdUser.username))
        .then((updatedUser) => expect(updatedUser.login_counter).to.be.equal(1))
        .then(done())
        .catch(wrongPromise(done));
    });

    it('should reset the login count', function (done) {
      var createdUser;
      createDefaultUser()
        .then(user => createdUser = user)
        .then(() => userService.findByUsername(createdUser.username))
        .then((user) => user.incrementLoginCount())
        .then(() => userService.findByUsername(createdUser.username))
        .then((user) => user.resetLoginCount())
        .then(() => userService.findByUsername(createdUser.username))
        .then(updatedUser => expect(updatedUser.login_counter).to.be.equal(0))
        .then(() => done())
        .catch(wrongPromise(done));
    });
  });

  describe('user permissions', function () {

    var roleAdmin;
    var roleRead;

    beforeEach(function (done) {
      var createRefundPermission;
      var viewTransactionsPermission;

      sync_db()
        .then(() => createPermission({name: "refunds:create", description: "View & Create Refunds"}))
        .then((permission)=> createRefundPermission = permission)
        .then(() => createPermission({name: "transactions:read", description: "View Transactions"}))
        .then((permission)=> viewTransactionsPermission = permission)
        .then(() => createRole({description: "Admin"}))
        .then((role)=> roleAdmin = role)
        .then(() => roleAdmin.setPermissions([createRefundPermission, viewTransactionsPermission]))
        .then(()=> createRole({description: "Read"}))
        .then((role)=> roleRead = role)
        .then(()=> roleRead.setPermissions([viewTransactionsPermission]))
        .then(()=> done())
        .catch(wrongPromise(done));
    });

    it('should have expected permissions from a user', function (done) {
      var retrievedUser;
      createDefaultUser()
        .then(user => user.setRole(roleAdmin))
        .then(()=> userService.findByUsername(defaultUser.username))
        .then((user) => retrievedUser = user)
        .then(()=> userService.hasPermission(retrievedUser, "refunds:create"))
        .then((hasCreateRefundsPermission) => expect(hasCreateRefundsPermission).to.be.true)
        .then(()=> userService.hasPermission(retrievedUser, "transactions:read"))
        .then((viewTransactionsPermission) => expect(viewTransactionsPermission).to.be.true)
        .then(()=> done())
        .catch(wrongPromise(done));
    });

    it('should have expected permissions when added role by primary key', function (done) {
      createDefaultUser()
        .then((user)=> user.setRole(roleRead))
        .then(()=> userService.findByUsername(defaultUser.username))
        .then((user) => userService.hasPermission(user, "transactions:read"))
        .then((viewTransactionsPermission)=> expect(viewTransactionsPermission).to.be.true)
        .then(()=> done())
        .catch(wrongPromise(done));
    });

    it('should not have permission when its role does not have it', function (done) {
      var retrievedUser;
      createDefaultUser()
        .then(user => user.setRole(roleRead))
        .then(()=> userService.findByUsername(defaultUser.username))
        .then((user) => retrievedUser = user)
        .then(()=> userService.hasPermission(retrievedUser, "refunds:create"))
        .then((hasCreateRefundsPermission)=> expect(hasCreateRefundsPermission).to.be.false)
        .then(()=> userService.hasPermission(retrievedUser, "transactions:read"))
        .then((viewTransactionsPermission)=> expect(viewTransactionsPermission).to.be.true)
        .then(()=> done())
        .catch(wrongPromise(done));
    });

    it('should override permissions when user changes role', function (done) {
      var userSetup;
      var retrievedUser;
      var roleWrite;
      var createTokensPermission;
      createDefaultUser()
        .then((user)=> userSetup = user)
        .then(() => userSetup.setRole(roleAdmin))
        .then(()=> createPermission({name: "tokens:create", description: "View & Create tokens"}))
        .then((permission)=> createTokensPermission = permission)
        .then(()=> createRole({description: "Write"}))
        .then((role)=> roleWrite = role)
        .then(()=> roleWrite.setPermissions([createTokensPermission]))
        .then(()=> userSetup.setRole(roleWrite))
        .then(()=> userService.findByUsername(defaultUser.username))
        .then((user) => retrievedUser = user)
        .then(()=> userService.hasPermission(retrievedUser,"refunds:create"))
        .then((hasCreateRefundsPermission)=> expect(hasCreateRefundsPermission).to.be.false)
        .then(()=> userService.hasPermission(retrievedUser, "transactions:read"))
        .then((viewTransactionsPermission)=> expect(viewTransactionsPermission).to.be.false)
        .then(()=> userService.hasPermission(retrievedUser, "tokens:create"))
        .then((viewTransactionsPermission)=> expect(viewTransactionsPermission).to.be.true)
        .then(()=> done())
        .catch(wrongPromise(done));
    });
  });

  describe('session version', () => {
    it('should increment session version', (done) => {
      var userSetup;

      createDefaultUser()
        .then((user)=> userSetup = user)
        .then(() => {
          expect(userSetup.session_version).to.equal(0);
          userSetup.incrementSessionVersion();
          expect(userSetup.session_version).to.equal(1);
          done();
        });
    })
  })
});
