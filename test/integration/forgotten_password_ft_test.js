var dbMock      = require(__dirname + '/../test_helpers/db_mock.js');
var request     = require('supertest');
var _app        = require(__dirname + '/../../server.js').getApp;
var winston     = require('winston');
var nock        = require('nock');
var csrf        = require('csrf');
var assert      = require('assert');
var should      = require('chai').should();
var paths       = require(__dirname + '/../../app/paths.js');
var session     = require(__dirname + '/../test_helpers/mock_session.js');
var proxyquire  = require('proxyquire');
var q           = require('q');
var ACCOUNT_ID  = 182364;

var forgotten = function(user = function(){}, forgottenPass = function(){}){
  return proxyquire(__dirname + '/../../app/controllers/forgotten_password_controller.js',{
  '../models/user.js': user,
  '../models/forgotten_password.js': forgottenPass
});
};

var app = session.getAppWithLoggedInSession(_app, ACCOUNT_ID);

describe('forgotten_password_controller', function () {
  describe('usernameGet', function () {
    it('should render the view',function(){
      forgotten().emailGet({},{render: function(name){
        assert.equal(name,"forgotten_password/username_get");
      }});
    });
  });

  describe('emailPost', function () {
    it('should display an error if csrf token does not exist for the forgotten password', function (done) {
      request(app)
      .post(paths.user.forgottenPassword)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({})
      .expect(200, { message: "There is a problem with the payments platform"})
      .end(done);
    });
  });

  describe('newPasswordGet', function () {
    it('should render on success',function(){
      forgotten({
        findByResetToken: function(id){
          return {
            then: function(suc,fail){
              suc(id);
            }
          };
        }
      }).newPasswordGet({params: {id:2}},{render: function(template, params){
        assert.equal(template,"forgotten_password/new_password");
        assert.equal(JSON.stringify(params),JSON.stringify({ id: 2 }));

      }});
    });

    it('should should show error view on failure of getting user',function(){
      forgotten({
        findByResetToken: function(id){
          return {
            then: function(suc,fail){
              fail();
            }
          };
        }
      }).newPasswordGet({params: {id:2},flash: ()=>{}},{redirect: function(url){
        assert.equal(url,"/login");
      }});
    });
  });

  describe('newPasswordPost', function () {

    it('should render error view on no user',function(){
      forgotten({
        findByResetToken: function(id){
          return {
            then: function(suc){
              suc();
              return {
                then: function(){
                  return {
                    then: function(){
                      return {
                        catch: function(){}
                      };
                    }
                  };
                }
              };
            }
          };
        },
      },
      {
        destroy: function(){ }
      }
      ).newPasswordPost({params: {id:2}, body: {password:'foo'}, headers:{}},{render: function(template, params){
        assert.equal(template,"error");
      }});
    });

    it('should call everything needed to update user',function(){
      updatePasswordCalled = false;
      logoutCalled = false
      forgotten({
        findByResetToken: function(id){
          return {
            then: function(suc){
              suc({
                updatePassword: function(password){
                  assert.equal(password,'foo');
                  updatePasswordCalled = true;
                },
                logOut: function(){
                  logoutCalled = true;
                  return { then: (cb)=> cb()}
                },
              });
              return {
                then: function(suc){
                  suc();
                  return {
                    then: function(suc){
                      suc();
                      return {
                        catch: function(){}
                      };
                    }
                  };
                }
              };
            }
          };
        }
      },
      {
        destroy: function(id){ assert.equal(id,2); }
      }
      ).newPasswordPost({params: {id:2}, body: {password:'foo'}, session: { regenerate : function(){}}, flash: ()=>{}},{redirect: function(path){
        assert.equal(updatePasswordCalled,true);
        assert.equal(logoutCalled,true);
        assert.equal(path,"/login");
      }});
    });

   it('should display an error if csrf token does not exist for the reset password', function (done) {
      request(app)
      .post(paths.user.forgottenPasswordReset)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({})
      .expect(200, { message: "There is a problem with the payments platform"})
      .end(done);
    });
  });
});
