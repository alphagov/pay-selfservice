var should = require('chai').should();
var assert = require('assert');
var cookies  = require(__dirname + '/../app/utils/cookies.js');

describe('session cookie', function () {

  it('should have the right structure', function () {
    assert.equal('session',cookies.sessionCookie().cookieName);
    assert.equal(true, cookies.sessionCookie().proxy);
    assert.deepEqual({httpOnly: true, secureProxy: true}, cookies.sessionCookie().cookie);
  });

});

describe('selfservice cookie', function () {

  it('should have the right structure', function () {
    assert.equal('selfservice_state', cookies.selfServiceCookie().cookieName);
    assert.equal(true, cookies.selfServiceCookie().proxy);
    assert.deepEqual({httpOnly: true, secureProxy: true}, cookies.selfServiceCookie().cookie);
  });

});
