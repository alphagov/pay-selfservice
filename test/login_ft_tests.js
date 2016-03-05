var request     = require('supertest');
var app         = require(__dirname + '/../server.js').getApp;
var logger      = require('winston');
var should      = require('chai').should();
var paths       = require(__dirname + '/../app/paths.js');

function build_get_request(path) {
  return request(app)
    .get(path);
}

describe('User clicks on Logout', function() {
  it('should get redirected to login page', function(done) {
    build_get_request(paths.user.logOut)
      .expect(302, {})
      .expect('Location', paths.user.logIn)
      .end(done);
  });
});
