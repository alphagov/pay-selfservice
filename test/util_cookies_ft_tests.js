require(__dirname + '/utils/html_assertions.js');
var should = require('chai').should();
var assert = require('assert');
var cookies  = require(__dirname + '/../app/utils/cookies.js');

describe('session cookie', function () {

  it('should have empty opts when unsecured', function () {
    process.env.SECURED = "false";
    assert.deepEqual({},cookies.sessionCookie().cookie);
    assert.equal('session',cookies.sessionCookie().cookieName);
  });

  it('should have secure opts when secured', function () {
    process.env.SECURED = "true";
    assert.deepEqual({httpOnly: true, secure: true},cookies.sessionCookie().cookie);
    assert.equal('session',cookies.sessionCookie().cookieName);
  });

});

describe('selfservice cookie', function () {

  it('should have empty opts when unsecured', function () {
    process.env.SECURED = "false";
    assert.deepEqual({},cookies.selfServiceCookie().cookie);
    assert.equal('selfservice_state',cookies.selfServiceCookie().cookieName);
  });

  it('should have secure opts when secured', function () {
    process.env.SECURED = "true";
    assert.deepEqual({httpOnly: true, secure: true},cookies.selfServiceCookie().cookie);
    assert.equal('selfservice_state',cookies.selfServiceCookie().cookieName);
  });

});
