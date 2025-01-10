const sinon = require('sinon')

const inviteCookeIsPresent = require('./invite-cookie-is-present')
const { RegistrationSessionMissingError } = require('../errors')

const res = {}
const next = sinon.spy()

describe('Invite cookie is present middleware', () => {
  beforeEach(() => {
    next.resetHistory()
  })

  it('should call next if cookie is present with all fields', () => {
    const req = {
      register_invite: {
        code: 'a-code',
        email: 'foo@example.com'
      }
    }
    inviteCookeIsPresent(req, res, next)
    sinon.assert.calledWithExactly(next)
  })

  it('should call next with an error if cookie is not present', () => {
    const req = {}
    inviteCookeIsPresent(req, res, next)
    sinon.assert.calledWithExactly(next, sinon.match.instanceOf(RegistrationSessionMissingError))
  })

  it('should call next with an error if code is not present on cookie', () => {
    const req = {
      register_invite: {
        email: 'foo@example.com'
      }
    }
    inviteCookeIsPresent(req, res, next)
    sinon.assert.calledWithExactly(next, sinon.match.instanceOf(RegistrationSessionMissingError))
  })

  it('should call next with an error if email is not present on cookie', () => {
    const req = {
      register_invite: {
        code: 'a-code'
      }
    }
    inviteCookeIsPresent(req, res, next)
    sinon.assert.calledWithExactly(next, sinon.match.instanceOf(RegistrationSessionMissingError))
  })
})
