var request = require('supertest');
var app = require(__dirname + '/../server.js').getApp;
var logger = require('winston');
var should = require('chai').should();
var logout_url = '/logout';
var login_url = '/login';

function build_get_request(path) {
  return request(app)
    .get(path);
}

describe('User clicks on Logout', function() {
  it('should get redirected to login page', function(done) {
    build_get_request(logout_url)
      .expect(302, {})
      .expect('Location', login_url)
      .end(done);
  });
});