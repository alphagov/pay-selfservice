require(__dirname + '/../test_helpers/html_assertions.js');
var should    = require('chai').should();
var assert    = require('assert');
var proxyquire= require('proxyquire');
var _         = require('lodash');
var expect    = require("chai").expect;
var nock      = require('nock');
var bcrypt    = require('bcrypt');
var q         = require('q');


var wrongPromise = function(data){
  throw new Error('Promise was unexpectedly fulfilled.');
};

var sequel = {
  sequelize :
    {
      sync: function(){ },
      define: function(){ return {
        findOne: function(){},
        create: function(){ }
      };
    }
  }
};

var User = function (mockSequelize) {
  return proxyquire(__dirname + '/../../app/models/user.js', {
    'sequelize': { STRING: ""} ,
    '../utils/sequelize_config.js': mockSequelize
  });
};



describe('user model', function() {
  describe('find', function(){
    it('should return a user', function () {
      var seq = _.cloneDeep(sequel);
      seq.sequelize.define = function(){
        return { findOne: function(params){
          var defer = q.defer();
          assert(params.where.email == "foo");
          return defer.promise;
        }};
      };
      User(seq).find("foo");
    });

    it('should never ever ever return a password with user outside the model', function () {
      var seq = _.cloneDeep(sequel);
      seq.sequelize.define = function(){
        return { findOne: function(params){
          var defer = q.defer();
          assert(params.where.email == "foo");
          assert(_.includes(params.attributes,'password') === false);
          return defer.promise;
        }};
      };
      User(seq).find("foo");
    });
  });
  describe('create',function(){
    it('should create a user', function (done) {
      var seq = _.cloneDeep(sequel);
      seq.sequelize.define = function(){
        return { create: function(user){
          assert(user.username == "foo");
          assert(user.password != "password");
          assert(bcrypt.compareSync('password',user.password))
          return {then : function (callback) {
            callback({dataValues: user});
          }};
        }};
      };
      User(seq).create({
        username: "foo",
        password: "password",
        gateway_account_id: 1,
        email: "foo@example.com"
      }).then(function(user){
        try {
          assert(user.username == "foo");
          assert(_.includes(user,'password') === false);
          done();
        } catch (e) {
          done(e);
        }

      });
    });

    it('should create a user witha specific otp_key', function (done) {
      var seq = _.cloneDeep(sequel);
      seq.sequelize.define = function(){
        return { create: function(user){
          assert(user.username == "foo");
          assert(user.password != "password");
          assert(bcrypt.compareSync('password',user.password))
          return {then : function (callback) {
            callback({dataValues: user});
          }};
        }};
      };
      User(seq).create({
        username: "foo",
        password: "password",
        gateway_account_id: 1,
        email: "foo@example.com",
        otp_key: "123"
      }).then(function(user){
        try {
          assert(user.username == "foo");
          assert(_.includes(user,'password') === false);
          assert(user.otp_key == "123");

          done();
        } catch (e) {
          done(e);
        }

      });
    });
  });



  describe('authenticate',function(){
    it('should authenticate a valid user', function (done) {
      var seq = _.cloneDeep(sequel);
      seq.sequelize.define = function(){
        return { findOne: function(params){
          return {then: function(callback){
            callback({dataValues: {
              password: "$2a$10$jJmJnbJFOLYz/DChN6VMVOfBQ0G94MRGSAjtp25j7BMBBQXpYoDZm",
              foo: "bar"
            }});
          }};
        }};
      };
      User(seq)
      .authenticate("foo@example.com", "password")
      .then(function (user) {
         try {
          assert(user.foo,"bar");
          assert(user.password ===undefined);
          done();
        } catch (e) {
          done(e);
        }

      },wrongPromise);
    });

    it('should not authenticate an invalid user', function (done) {
      var seq = _.cloneDeep(sequel);
      seq.sequelize.define = function(){
        return { findOne: function(params){
          return {then: function(callback){
            callback({dataValues: {
              password: "$2a$10$jJmJnbJFOLYz/DChN6VMVOfBQ0G94MRGSAjtp25j7BMBBQXpYoDZm",
              foo: "bar"
            }});
          }};
        }};
      };
      User(seq)
      .authenticate("foo@example.com", "password2")
      .then(wrongPromise,function(){
        assert(true);
        done();
      });
    });
  });

  describe('updateOtpKey',function(){
    it('shouldupdate the otp key', function (done) {
      var seq = _.cloneDeep(sequel);
      seq.sequelize.define = function(){
        return {
          findOne: function(params){
            return {
              then: function(callback){
                callback({
                  dataValues: {
                    password: "$2a$10$jJmJnbJFOLYz/DChN6VMVOfBQ0G94MRGSAjtp25j7BMBBQXpYoDZm",
                    foo: "bar"
                  },
                  updateAttributes: function(params){
                    return {
                      then: function(callback){
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
      .updateOtpKey('foo@bar.com',"1234")
      .then(function (user) {
        assert(true);
        done();
      },wrongPromise);
    });
  });
});

