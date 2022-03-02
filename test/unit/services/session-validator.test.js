const path = require('path')
const assert = require('assert')
const mockSession = require(path.join(__dirname, '/../../test-helpers/mock-session.js'))
const sessionValidator = require(path.join(__dirname, '/../../../app/services/session-validator.js'))

describe('session validator', () => {
  it('should allow a user with a current session', () => {
    const user = mockSession.getUser({ session_version: 1 })
    const validSession = { version: 1 }

    assert(sessionValidator.validate(user, validSession))
  })

  it('should deny a user with a terminated session', () => {
    const loggedOutUser = mockSession.getUser({ session_version: 2 })
    const currentSession = { version: 1 }

    assert(sessionValidator.validate(loggedOutUser, currentSession) === false)
  })
})
