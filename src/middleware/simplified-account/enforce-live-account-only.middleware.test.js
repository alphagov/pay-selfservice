const { expect } = require('chai')
const { NotFoundError } = require('@root/errors')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const { LIVE, NOT_STARTED } = require('@models/constants/go-live-stage')

describe('Middleware: enforceLiveAccountOnly', () => {
  let enforceLiveAccountOnly, req, res, next

  beforeEach(() => {
    enforceLiveAccountOnly = proxyquire('./enforce-live-account-only.middleware', {})
    req = {
      account: {
        type: 'test'
      },
      service: {
        currentGoLiveStage: NOT_STARTED
      }
    }
    res = {}
    next = sinon.stub()
  })

  it('should call next() when account type is test and service is not live', () => {
    enforceLiveAccountOnly(req, res, next)

    expect(next.calledOnce).to.be.true
    expect(next.args[0]).to.be.empty
  })

  it('should call next() when account type is live and service is live', () => {
    req.service.currentGoLiveStage = LIVE
    req.account.type = 'live'
    enforceLiveAccountOnly(req, res, next)

    expect(next.calledOnce).to.be.true
    expect(next.args[0]).to.be.empty
  })

  it('should call next() with error when account type is test service is live', () => {
    req.service.currentGoLiveStage = LIVE
    enforceLiveAccountOnly(req, res, next)
    const expectedError = sinon.match.instanceOf(NotFoundError)
      .and(sinon.match.has('message', 'Attempted to access live only setting in sandbox mode for service that has gone live'))
    sinon.assert.calledWith(next, expectedError)
  })
})
