var assert = require('assert');
var mockSession = require(__dirname + '/../../test_helpers/mock_session.js');
const sessionValidator = require(__dirname + '/../../../app/services/session_validator.js');

describe('session validator', () => {
  it('should allow a user with a current session', () => {
    var user = mockSession.getUser({session_version: 1});
    var validSession = {version: 1};

    assert(sessionValidator.validate(user, validSession));
  });

  it('should deny a user with a terminated session', () => {
    let loggedOutUser = mockSession.getUser({session_version: 2});
    let currentSession = {version: 1};

    assert(sessionValidator.validate(loggedOutUser, currentSession) === false);
  });
});
