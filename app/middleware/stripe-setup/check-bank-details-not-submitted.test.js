'use strict'

// NPM dependencies
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const proxyquire = require('proxyquire')
const sinon = require('sinon')

// Local dependencies
const paths = require('../../paths')

// Global setup
chai.use(chaiAsPromised)
const { expect } = chai // must be called after chai.use(chaiAsPromised) to use "should.eventually"

describe('Check bank details not submitted middleware', () => {
  let req
  let res
  let next

  beforeEach(() => {
    req = {
      correlationId: 'correlation-id',
      account: {
        gateway_account_id: '1'
      },
      flash: sinon.spy()
    }
    res = {
      setHeader: sinon.stub(),
      status: sinon.spy(),
      render: sinon.spy(),
      redirect: sinon.spy()
    }
    next = sinon.spy()
  })

  it('should call next when bank account flag is false', done => {
    const middleware = getMiddlewareWithConnectorClientResolvedPromiseMock({
      bankAccount: false
    })

    middleware(req, res, next)

    setTimeout(() => {
      expect(next.calledOnce).to.be.true // eslint-disable-line
      expect(req.flash.notCalled).to.be.true // eslint-disable-line
      expect(res.redirect.notCalled).to.be.true // eslint-disable-line
      done()
    }, 250)
  })

  it('should redirect to the dashboard with error message when bank account flag is true', done => {
    const middleware = getMiddlewareWithConnectorClientResolvedPromiseMock({
      bankAccount: true
    })

    middleware(req, res, next)

    setTimeout(() => {
      expect(next.notCalled).to.be.true // eslint-disable-line
      expect(req.flash.calledWith('genericError', 'You’ve already provided your bank details.<br />Contact GOV.UK Pay support if you need to update them.')).to.be.true // eslint-disable-line
      expect(res.redirect.calledWith(303, paths.dashboard.index)).to.be.true // eslint-disable-line
      done()
    }, 250)
  })

  it('should render an error page when req.account is undefined', done => {
    const middleware = getMiddlewareWithConnectorClientResolvedPromiseMock({
      bankAccount: false
    })
    req.account = undefined

    middleware(req, res, next)

    setTimeout(() => {
      expect(next.notCalled).to.be.true // eslint-disable-line
      expect(res.status.calledWith(500)).to.be.true // eslint-disable-line
      expect(res.render.calledWith('error', {message: 'Internal server error'})).to.be.true // eslint-disable-line
      done()
    }, 250)
  })

  it('should render an error page when connector rejects the call', done => {
    const middleware = getMiddlewareWithConnectorClientRejectedPromiseMock({
      bankAccount: false
    })

    middleware(req, res, next)

    setTimeout(() => {
      expect(next.notCalled).to.be.true // eslint-disable-line
      expect(res.status.calledWith(500)).to.be.true // eslint-disable-line
      expect(res.render.calledWith('error', {message: 'Please try again or contact support team'})).to.be.true // eslint-disable-line
      done()
    }, 250)
  })
})

function getMiddlewareWithConnectorClientResolvedPromiseMock (getStripeAccountSetupResponse) {
  return proxyquire('./check-bank-details-not-submitted', {
    '../../services/clients/connector.client': {
      ConnectorClient: function () {
        this.getStripeAccountSetup = (gatewayAccountId, correlationId) => {
          return new Promise(resolve => {
            resolve(getStripeAccountSetupResponse)
          })
        }
      }
    }
  })
}

function getMiddlewareWithConnectorClientRejectedPromiseMock (getStripeAccountSetupResponse) {
  return proxyquire('./check-bank-details-not-submitted', {
    '../../services/clients/connector.client': {
      ConnectorClient: function () {
        this.getStripeAccountSetup = (gatewayAccountId, correlationId) => {
          return new Promise((resolve, reject) => {
            reject(new Error())
          })
        }
      }
    }
  })
}
