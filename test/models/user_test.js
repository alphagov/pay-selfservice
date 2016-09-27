require(__dirname + '/../test_helpers/html_assertions.js');
var should = require('chai').should();
var assert = require('assert');
var proxyquire = require('proxyquire');
var _ = require('lodash');
var expect = require("chai").expect;
var nock = require('nock');
var bcrypt = require('bcrypt');
var q = require('q');


var wrongPromise = function(data) {
  throw new Error('Promise was unexpectedly fulfilled.');
};

var sequel = {
  sequelize: {
    sync: function() {},
    define: function() {
      return {
        findOne: function() {},
        create: function() {},
        hasMany: function() {}
      };
    },
    query: function(){ return { then: (suc)=> suc() }}
  }
};

var User = function(mockSequelize,includes=[]) {
  var requires = _.merge(includes,{
    'sequelize': { STRING: "" },
    './../utils/sequelize_config.js': mockSequelize
  });


  return proxyquire(__dirname + '/../../app/models/user.js', requires);
};



describe('user model', function() {
  describe('find', function() {
    it('should return a user and lowercase email', function() {
      var seq = _.cloneDeep(sequel);
      seq.sequelize.define = function() {
        return {
          findOne: function(params) {
            var defer = q.defer();
            assert(params.where.email == "foo@foo.com");
            return defer.promise;
          },
          hasMany: () => {},
          beforeUpdate: ()=>{},
          beforeCreate: ()=>{},
        };
      };
      User(seq).find("Foo@foo.com");
    });

    it('should never ever ever return a password with user outside the model', function() {
      var seq = _.cloneDeep(sequel);
      seq.sequelize.define = function() {
        return {
          findOne: function(params) {
            var defer = q.defer();
            assert(params.where.email == "foo");
            assert(_.includes(params.attributes, 'password') === false);
            return defer.promise;
          },
          hasMany: () => {},
          beforeUpdate: ()=>{},
          beforeCreate: ()=>{},
        };
      };
      User(seq).find("foo");
    });
  });

  describe('create', function() {
    it('should create a user and lowercase email', function(done) {
      var seq = _.cloneDeep(sequel);
      seq.sequelize.define = function() {
        return {
          beforeUpdate: ()=>{},
          beforeCreate: ()=>{},
          create: function(user) {
            assert(user.username == "foo");
            assert(user.email ==  "foo@example.com");
            assert(user.password == "password10");
            return {
              then: function(callback) {
                callback({
                  dataValues: user
                });
              }
            };
          },
          hasMany: () => {}
        };
      };
      User(seq).create({
        username: "foo",
        password: "password10",
        gateway_account_id: 1,
        email: "Foo@example.com",
        telephone_number: "1"
      }).then(function(user) {
        try {
          assert(user.username == "foo");
          assert(_.includes(user, 'password10') === false);
          done();
        } catch (e) {
          done(e);
        }

      });
    });

    it('should create a user with a specific otp_key and encrypts password', function(done) {
      var seq = _.cloneDeep(sequel);
      seq.sequelize.define = function() {
        return {
          hasMany: () => {},
          beforeUpdate: ()=>{},
          beforeCreate: (cb)=>{
            cb({ 
              changed: ()=> {return true},
              get: () => { return "password10"; },
              set: (name,hash)=> {
                assert(name == "password");
                assert(hash != "password10")
              } 
            })
          },
          create: function(user) {
            assert(user.username == "foo");
            assert(user.email ==  "foo@example.com");
            assert(user.password == "password10");
            return {
              then: function(callback) {
                callback({
                  dataValues: user
                });
              },
              hasMany: () => {}
            };
          }
        };
      };
      User(seq).create({
        username: "foo",
        password: "password10",
        gateway_account_id: 1,
        email: "Foo@example.com",
        telephone_number: "1"
      }).then(function(user) {
        try {
          assert(user.username == "foo");
          assert(_.includes(user, 'password10') === false);
          done();
        } catch (e) {
          done(e);
        }

      });
    });

  });

  describe('authenticate', function() {
    it('should authenticate a valid user', function(done) {
      var seq = _.cloneDeep(sequel);
      seq.sequelize.define = function() {
        return {
          hasMany: () => {},
          beforeUpdate: ()=>{},
          beforeCreate: ()=>{},
          findOne: function(params) {
            return {
              then: function(callback) {
                callback({
                  dataValues: {
                    password: "$2a$10$jJmJnbJFOLYz/DChN6VMVOfBQ0G94MRGSAjtp25j7BMBBQXpYoDZm",
                    foo: "bar"
                  }
                });
              }
            };
          }
        };
      };
      User(seq)
        .authenticate("foo@example.com", "password")
        .then(function(user) {
          try {
            assert(user.foo, "bar");
            assert(user.password === undefined);
            done();
          } catch (e) {
            done(e);
          }

        }, wrongPromise);
    });

    it('should not authenticate an invalid user', function(done) {
      var seq = _.cloneDeep(sequel);
      seq.sequelize.define = function() {
        return {
          hasMany: () => {},
          beforeUpdate: ()=>{},
          beforeCreate: ()=>{},
          findOne: function(params) {
            return {
              then: function(callback) {
                callback({
                  dataValues: {
                    password: "$2a$10$jJmJnbJFOLYz/DChN6VMVOfBQ0G94MRGSAjtp25j7BMBBQXpYoDZm",
                    foo: "bar"
                  }
                });
              }
            };
          }
        };
      };
      User(seq)
        .authenticate("foo@example.com", "password2")
        .then(wrongPromise, function() {
          assert(true);
          done();
        });
    });
  });

  describe('updateOtpKey', function() {
    it('should update the otp key', function(done) {
      var seq = _.cloneDeep(sequel);
      seq.sequelize.define = function() {
        return {
          hasMany: () => {},
          beforeUpdate: ()=>{},
          beforeCreate: ()=>{},
          findOne: function(params) {
            return {
              then: function(callback) {
                callback({
                  dataValues: {
                    password: "$2a$10$jJmJnbJFOLYz/DChN6VMVOfBQ0G94MRGSAjtp25j7BMBBQXpYoDZm",
                    foo: "bar"
                  }
                  ,
                  updateAttributes: function(params) {
                    return {
                      then: function(callback) {
                        assert(params.otp_key === '1234');
                        callback();
                      }
                    };
                  }
                });
              }
            };
          }
        };
      };
      User(seq)
        .updateOtpKey('foo@bar.com', "1234")
        .then(function(user) {
          assert(true);
          done();
        }, wrongPromise);
    });
  });

  describe('sendPasswordResetToken', function() {
    it('should send an email', function(done) {
      var seq = _.cloneDeep(sequel);
      var pass = { sequelize: { create: function(data){
        return { then: function(cb,fail){cb()}}
      }}};
      var sendEmail = { sendEmail: function(template,email,data){
        assert(template == "template_id");
        assert(email == "foo@bar.com");
        assert(data.code.indexOf('https://selfservice.pymnt.localdomain/reset-password/') == 0);
        assert(data.code.length, 73);

        return { then: function(cb,fail){cb()}}
      }};


      seq.sequelize.define = function() {
        return {
          findOne: function(params) {
            var defer = q.defer();
            setTimeout(function(){
              defer.resolve({ dataValues: {
                email: "foo@bar.com",
                id: 1
              }});
            }, 10)
            return defer.promise;
          },
          hasMany: () => {},
          beforeUpdate: ()=>{},
          beforeCreate: ()=>{},
        };
      };
      var user = User(seq,{
        './forgotten_password.js': pass,
        '../services/notification_client.js': sendEmail
      });

      user.find('1')
        .then(function(user){ return user.sendPasswordResetToken();})
        .then(done)
        .catch(function(){ assert(false);});
    });
  });


  describe('updatePassword', function() {
    it('should update the password', function(done) {
      var seq = _.cloneDeep(sequel);
      var values = {dataValues: { id: 2, password: 'foo'},save: ()=>  {return { then: (success,fail)=> {success(); }}}};

      seq.sequelize.define = function() {
        return {
          findOne: function(){
            return { then: function(success){ success(values); }};
          },
          hasMany: () => {},
          query:() => {},
          beforeUpdate: ()=>{},
          beforeCreate: ()=>{},
        };
      };
      var user = User(seq);

      user.find('1')
        .then(function(user){ return user.updatePassword('foo1234567')})
        .then(done)
        .catch(done);
    });

    it('should reject if forgotten password not found', function(done) {
      var seq = _.cloneDeep(sequel);
      var values = null;

      seq.sequelize.define = function() {
        return {
          update: function(password,sql) {
            assert(values.dataValues.password != password);
            assert(password.length !== 0);
            assert.equal(values.dataValues.id,sql.where.id);
            return { then: function(success){ success(); } };
          },
          findOne: function(){
            return { then: function(success){ success(values); }};
          },
          beforeUpdate: ()=>{},
          beforeCreate: ()=>{},
          hasMany: () => {}
        };
      };
      var user = User(seq);

      user.find('1')
        .then(function(user){ return user.updatePassword('foo')})
        .then(function(){ assert(false);})
        .catch(done);
    });
  });


  describe('findByResetToken', function() {
      // TODO
      // REMOVE SEQUELIZE MOCKING ONCE WE HAVE A TEST DB SETUP
    it('should update the password', function(done) {
      var seq = _.cloneDeep(sequel);
      var values = {dataValues: { id: 2, password: 'foo'},save: ()=>  {return { then: (success,fail)=> {success(); }}}};

      seq.sequelize.define = function() {
        return {
          findOne: function(){
            return { then: function(success){ success(values); }};
          },
          beforeUpdate: ()=>{},
          beforeCreate: ()=>{},
          hasMany: () => {}
        };
      };
      var user = User(seq);

      user.find('1')
        .then(function(user){ return user.updatePassword('foo1234567')})
        .then(done)
        .catch(done);
    });
    it.skip('should not update the password if it is timed out.', function(done) {
      // WE REALLY NEED A DATABaSE TO TEST THIS PROPERLY PP-1006
      // WILL BE HANDLED AFTER DEPLOY
    });
  });

  describe('toggle user',function(){
    _.each([true,false],function(boolean){
      it('should be able to disable and enable the user',function(done){

        var seq = _.cloneDeep(sequel);
        var values = {dataValues: { id: 2, password: 'foo'}};

        seq.sequelize.define = function() {
          return {
            update: function(toggle,where) {
              assert(toggle.disabled === boolean);
              assert.equal(values.dataValues.id,where.where.id);
              return { then: function(success){ success(); } };
            },
            findOne: function(){
              return { then: function(success){ success(values); }};
            },
            beforeUpdate: ()=>{},
            beforeCreate: ()=>{},
            hasMany: () => {}
          };
        };
        var user = User(seq);

        user.find('1')
          .then(function(user){ return user.toggleDisabled(boolean)})
          .then(done)
          .catch(done);

      });
    });
  });

});
