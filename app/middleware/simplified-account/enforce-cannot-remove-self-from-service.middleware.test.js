const { expect } = require('chai')
const { NotFoundError } = require('@root/errors')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const User = require('@models/User.class')
const userFixtures = require('@test/fixtures/user.fixtures')

describe('Middleware: enforceCannotRemoveSelfFromService', () => {
  let enforceCannotRemoveSelfFromService, req, res, next

  const setupTest = (additionalReqProps = {}) => {
    enforceCannotRemoveSelfFromService = proxyquire('./enforce-cannot-remove-self-from-service.middleware', {})
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

  it('should call next() when logged in user is removing another user from the service', () => {
    setupTest({ params: { externalUserId: 'user-id-to-remove' } })
    enforceCannotRemoveSelfFromService(req, res, next)
    expect(next.calledOnce).to.be.true // eslint-disable-line
    expect(next.args[0]).to.be.empty // eslint-disable-line
  })

  it('should call next() with error when logged in user is attempting to remove self from the service', () => {
    setupTest({ params: { externalUserId: 'user-id-for-admin-user' } })
    enforceCannotRemoveSelfFromService(req, res, next)
    const expectedError = sinon.match.instanceOf(NotFoundError)
      .and(sinon.match.has('message', 'Attempted to remove self from service'))
    sinon.assert.calledWith(next, expectedError)
  })
})
