
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
    expect(email).to.be.equal("foo@foo.com");
    expect(data.code.indexOf('https://selfservice.pymnt.localdomain/reset-password/')).to.be.equal(0);
    expect(data.code.length).to.be.equal(62);

    return {
      then: function (cb) {
        cb()
      }
    }
  }
};

var testSequelizeConfig = require(__dirname + '/../test_helpers/test_sequelize_config.js');

var ForgottenPassword = proxyquire(__dirname + '/../../app/models/forgotten_password.js', {
  '../utils/sequelize_config.js': testSequelizeConfig
});

var User = proxyquire(__dirname + '/../../app/models/user.js', {
  './../utils/sequelize_config.js': testSequelizeConfig,
  '../utils/random.js': {key: () => defaultOtpKey},
  './forgotten_password.js': ForgottenPassword,
  '../services/notification_client.js': mockedNotificationClient
});

var wrongPromise = function (done) {
  return (reason) => {
    var error = new Error('Promise was unexpectedly fulfilled. Error: ', reason);
    if (done) {
      done(error);
    }
    throw error;
  }
};

var defaultUser = {
  username: "foo",
  password: defaultPassword,
  gateway_account_id: 1,
  email: "foo@foo.com",
  telephone_number: "1"
};

var defaultSession = {
  data: defaultUser.email
}

var createDefaultSession = (extendedAttributes) => {
  var sessionAttributes = _.extend({}, defaultSession, extendedAttributes);
  return Sessions.create(sessionAttributes);
};

var findFromSession = (where) => {
  return Sessions.findOne({where: where});
};

var createDefaultUser = function (extendedAttributes) {
  var userAttributes = _.extend({}, defaultUser, extendedAttributes);
  return User.create(userAttributes);
};

var createDefaultForgottenPassword = function (extendedAttributes) {
  var forgottenPasswordAttributes = _.extend({
    date: Date.now(),
    code: defaultForgottenPasswordCode
  }, extendedAttributes);
  return ForgottenPassword.sequelize.create(forgottenPasswordAttributes);
};

var yesterdayDate = () => {
  var date = new Date();
  date.setDate(date.getDate() - 1);
  return date;
};

var Sessions = testSequelizeConfig.sequelize.define('Sessions', {data: {type: Sequelize.STRING}});

describe('user model', function () {
  beforeEach(function (done) {
    User.sequelize.sync({force: true}).then(() => {
      ForgottenPassword.sequelize.sync({force: true}).then(() => {
        Sessions.sync({force: true}).then(() => done());
      });
    });
  });

  describe('find', function () {
    it('should return a user and lowercase email', function (done) {
      createDefaultUser().then(() => {
        User.find("Foo@foo.com").then(() => done(), wrongPromise(done));
      })
    });

    it('should return a user by username', function (done) {
      createDefaultUser().then(() => {
        User.findByUsername("foo").then(() => done(), wrongPromise(done));
      })
    });

    it('should never ever ever return a password with user outside the model', function (done) {
      createDefaultUser().then(() => {
        User.find("foo@foo.com").then((user) => {
          expect(user).to.not.have.property('password');
          done();
        }, wrongPromise(done));
      })
    });
  });

  describe('create', function () {
    it('should create a user and lowercase email', function (done) {
      var userAttributes = {
        username: "foo",
        password: "password10",
        gateway_account_id: "1",
        email: "Foo@example.com",
        telephone_number: "1"
      };
      User.create(userAttributes).then(user => {
        expect(user.email).equal(userAttributes.email.toLowerCase());

        User.find(user.email).then(user => {
          expect(user.username).equal(userAttributes.username);
          expect(user.gateway_account_id).equal(userAttributes.gateway_account_id);
          expect(user.email).equal(userAttributes.email.toLowerCase());
          expect(user.telephone_number).equal(userAttributes.telephone_number);
          done();
        }, wrongPromise(done));
      }, wrongPromise(done));
    });

    it('should create a user with a specific otp_key and encrypts password', function (done) {
      createDefaultUser().then(user => {
        User.find(user.email).then(user => {
          expect(user.otp_key).equal(defaultOtpKey);
          done();
        }, wrongPromise(done));
      }, wrongPromise(done));
    });
  });

  describe('authenticate', function () {
    it('should authenticate a valid user', function (done) {
      createDefaultUser().then(user => {
        User.authenticate(user.username, defaultPassword).then(() => done(), wrongPromise(done))
      }, wrongPromise(done));
    });

    it('should not authenticate an invalid user', function (done) {
      createDefaultUser().then(user => {
        User.authenticate(user.email, "wrongPassword").then(wrongPromise(done), () => done())
      }, wrongPromise(done));
    });
  });

  describe('updateOtpKey', function () {
    it('should update the otp key', function (done) {
      createDefaultUser().then(user => {
        User.updateOtpKey(user.email, "123").then(user => {
          expect(user.otp_key).equal("123");
          done();
        }, wrongPromise(done));
      });
    });
  });

  describe('sendPasswordResetToken', function () {
    it('should send an email', function (done) {
      createDefaultUser().then(user => {
        User.find(user.email).then(user => {
          user.sendPasswordResetToken('some-correlation-id');
          done();
        }, wrongPromise(done));
      }, wrongPromise(done));
    });
  });

  describe('updatePassword', function () {
    it('should update the password', function (done) {
      createDefaultUser().then(user => {
        User.authenticate(user.username, "newPassword")
          .then(wrongPromise(done), () => {
            user.updatePassword("newPassword").then(() => {
              User.authenticate(user.username, "newPassword").then(() => done(), wrongPromise(done));
            }, wrongPromise(done))
          })
      }, wrongPromise(done));
    });
  });

  describe('updateUserNameAndEmail', function () {
    it('should update the password', function (done) {
      createDefaultUser().then(user => {
        user.updateUserNameAndEmail('hi@bye.com')
          .then((user)=>{
            expect(user.username).equal('hi@bye.com');
            expect(user.email).equal('hi@bye.com');
            done()
          }

          ,wrongPromise(done));
      }, wrongPromise(done));
    });
  });

  describe('findByResetToken', function () {
    it('should fail when forgotten password token is unknown', function (done) {
      User.findByResetToken("unknownCode").then(wrongPromise(done), () => done());
    });

    it('should fail when forgotten password token has expired', function (done) {
      createDefaultUser().then(user => {
        createDefaultForgottenPassword({date: yesterdayDate(), userId: user.id}).then(() => {
          User.findByResetToken(defaultForgottenPasswordCode).then(wrongPromise(done), () => done());
        }, wrongPromise(done));
      }, wrongPromise(done));
    });

    it('should find the forgotten password token', function (done) {
      createDefaultUser().then(user => {
        createDefaultForgottenPassword({userId: user.id}).then(() => {
          User.findByResetToken(defaultForgottenPasswordCode).then(() => {
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
    it('should logout', function (done) {
      createDefaultSession().then(() => {
        createDefaultUser().then(user => {
          findFromSession({data: defaultUser.email}).then((sessionData) => {
            expect(sessionData).to.not.be.null;
            user.logOut().then(() => {
              findFromSession({data: defaultUser.email}).then((sessionData) => {
                expect(sessionData).to.be.null;
                done();
              }, wrongPromise(done));
            }, wrongPromise(done))
          }, wrongPromise(done));
        }, wrongPromise(done));
      }, wrongPromise(done));
    });
  });

  describe('toggle user', function () {
    it('should be able to disable the user', function (done) {
      createDefaultUser({disabled: false}).then(() => {
        User.find(defaultUser.email).then((user) => {
          user.toggleDisabled(true).then(() => {
            User.find(defaultUser.email).then((updatedUser) => {
              expect(updatedUser.disabled).to.be.true;
              done();
            }, wrongPromise(done));
          }, wrongPromise(done));
        }, wrongPromise(done));
      }, wrongPromise(done));
    });

    it('should be able to enable the user', function (done) {
      createDefaultUser().then(() => {
        User.find(defaultUser.email).then((user) => {
          user.toggleDisabled(true).then(() => {
            User.find(defaultUser.email).then((user) => {
              user.toggleDisabled(false).then(() => {
                User.find(defaultUser.email).then((updatedUser) => {
                  expect(updatedUser.disabled).to.be.false;
                  expect(updatedUser.login_counter).to.be.equal(0);
                  done();
                }, wrongPromise(done));
              }, wrongPromise(done));
            }, wrongPromise(done));
          }, wrongPromise(done));
        }, wrongPromise(done));
      }, wrongPromise(done));
    });
  });

  describe('increment login count', function () {
    it('should update the login count', function (done) {
      createDefaultUser().then(() => {
        User.find(defaultUser.email).then((user) => {
          user.incrementLoginCount().then(() => {
            User.find(defaultUser.email).then((updatedUser) => {
              expect(updatedUser.login_counter).to.be.equal(1);
              done();
            }, wrongPromise(done));
          }, wrongPromise(done));
        }, wrongPromise(done));
      }, wrongPromise(done));
    });
  });

  describe('reset login count', function () {
    it('should reset the login count', function (done) {
      createDefaultUser().then(() => {
        User.find(defaultUser.email).then((user) => {
          user.incrementLoginCount().then(() => {
            User.find(defaultUser.email).then((user) => {
              user.resetLoginCount().then(() => {
                User.find(defaultUser.email).then((updatedUser) => {
                  expect(updatedUser.login_counter).to.be.equal(0);
                  done();
                }, wrongPromise(done));
              }, wrongPromise(done));
            }, wrongPromise(done));
          }, wrongPromise(done));
        }, wrongPromise(done));
      }, wrongPromise(done));
    });
  });

})
;
