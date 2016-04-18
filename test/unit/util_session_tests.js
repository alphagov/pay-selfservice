var should = require('chai').should();
var assert = require('assert');
var cookies = require(__dirname + '/../../app/utils/session.js');

describe('session', function () {

  it('should contain session properties', function(){
    var selfServiceSession = cookies.selfServiceSession();
    assert.equal('selfservice_state', selfServiceSession.name);
    assert.equal(true, selfServiceSession.proxy);
    assert.equal(false, selfServiceSession.saveUninitialized);
    assert.equal(false, selfServiceSession.resave);
    assert.equal(process.env.SESSION_ENCRYPTION_KEY, selfServiceSession.secret);
    assert.equal(parseInt(process.env.COOKIE_MAX_AGE), selfServiceSession.cookie.maxAge);
    assert.equal(true, selfServiceSession.cookie.httpOnly);
  });

  it('should have secure proxy off in unsecured environment', function () {
    process.env.SECURE_COOKIE_OFF = "true";
    assert.equal(false, cookies.selfServiceSession().cookie.secure);
  });

  it('should have secure proxy on in a secured https environment', function () {
    process.env.SECURE_COOKIE_OFF = "false";
    assert.equal(true, cookies.selfServiceSession().cookie.secure);
  });

});
