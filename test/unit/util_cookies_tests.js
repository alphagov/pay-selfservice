var should = require('chai').should();
var assert = require('assert');
var cookies = require(__dirname + '/../../app/utils/cookies.js');

describe('session cookie', function () {

  it('should have secure proxy off in unsecured environment', function () {
    process.env.SECURE_COOKIE_OFF = "true";
    assert.equal(true, cookies.sessionCookie().proxy);
    assert.deepEqual({httpOnly: true, secure: false, maxAge: 10800000}, cookies.sessionCookie().cookie);
  });

  it('should have secure proxy on in a secured https environment', function () {
    process.env.SECURE_COOKIE_OFF = "false";
    assert.equal(true, cookies.sessionCookie().proxy);
    assert.deepEqual({httpOnly: true, secure: true, maxAge: 10800000}, cookies.sessionCookie().cookie);
  });

});
