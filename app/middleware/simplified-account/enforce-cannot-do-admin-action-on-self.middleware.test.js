const { expect } = require('chai')
const { NotFoundError } = require('@root/errors')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const User = require('@models/User.class')
const userFixtures = require('@test/fixtures/user.fixtures')

describe('Middleware: enforceCannotDoAdminActionOnSelf', () => {
  let enforceCannotDoAdminActionOnSelf, req, res, next

  const setupTest = (additionalReqProps = {}) => {
    enforceCannotDoAdminActionOnSelf = proxyquire('./enforce-cannot-do-admin-action-on-self.middleware', {})
    const adminUser = new User(userFixtures.validUserResponse({
      external_id: 'user-id-for-admin-user',
      email: 'admin-user@users.gov.uk'
    }))
    req = {
      account: {
        type: 'test'
      },
      user: adminUser,
      ...additionalReqProps
    }
    res = {}
    next = sinon.stub()
  }

  it('should call next() when logged in user is doing an action action on another user from the service', () => {
    setupTest({ params: { externalUserId: 'another-user-id' } })
    enforceCannotDoAdminActionOnSelf('A specific error message')(req, res, next)
    expect(next.calledOnce).to.be.true // eslint-disable-line
    expect(next.args[0]).to.be.empty // eslint-disable-line
  })

  it('should call next() with error when logged in user is doing an admin action on themselves', () => {
    setupTest({ params: { externalUserId: 'user-id-for-admin-user' } })
    enforceCannotDoAdminActionOnSelf('A specific error message')(req, res, next)
    const expectedError = sinon.match.instanceOf(NotFoundError)
      .and(sinon.match.has('message', 'A specific error message'))
    sinon.assert.calledWith(next, expectedError)
  })
})
