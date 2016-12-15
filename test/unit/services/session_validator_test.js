var should = require('chai').should();
var assert = require('assert');
var sinon = require('sinon');
const sessionValidator = require(__dirname + '/../../../app/services/session_validator.js');

describe('session validator', () => {
  it('should allow a user with a current session', () => {
    var getSessionVersion = sinon.stub().returns(0);
    var user = {
      getSessionVersion: getSessionVersion
    };

    var validSession = {version: 0};

    assert(sessionValidator.validate(user, validSession));
  });

  it('should deny a user with a terminated session', () => {
    var getSessionVersion = sinon.stub().returns(1);
    var user = {
      getSessionVersion: getSessionVersion
    };

    var inValidSession = {version: 0};

    assert(sessionValidator.validate(user, inValidSession) === false);
  });

  it('should increment user session version', () => {
    var incrementSessionVersion = sinon.spy();
    var user = {
      incrementSessionVersion: incrementSessionVersion
    };

    sessionValidator.incrementSessionVersion(user);

    assert(incrementSessionVersion.calledOnce);
  });
});