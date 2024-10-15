const { expect } = require('chai')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

describe('Middleware: isOptedInToSimplifiedAccounts', () => {
  let isOptedInToSimplifiedAccounts, req, res, next, invalidConfigurationError

  beforeEach(() => {
    invalidConfigurationError = sinon.stub()
    isOptedInToSimplifiedAccounts = proxyquire('./simplified-account-opt-in.middleware', {
      '../../errors': { InvalidConfigurationError: invalidConfigurationError }
    })

    req = {
      user: {
        externalId: 'user-123',
        isDegatewayed: sinon.stub()
      }
    }
    res = {}
    next = sinon.stub()
  })

  it('should call next() when user is opted in', () => {
    req.user.isDegatewayed.returns(true)

    isOptedInToSimplifiedAccounts(req, res, next)

    expect(next.calledOnce).to.be.true // eslint-disable-line
    expect(next.args[0]).to.be.empty // eslint-disable-line
  })

  it('should call next() with error when user is not opted in', () => {
    req.user.isDegatewayed.returns(false)

    isOptedInToSimplifiedAccounts(req, res, next)

    expect(next.calledOnce).to.be.true // eslint-disable-line
    expect(invalidConfigurationError.calledOnce).to.be.true // eslint-disable-line
    expect(invalidConfigurationError.args[0][0]).to.equal(
      'User with id user-123 not opted in to account simplification or feature is disabled in this environment.'
    )
  })
})
