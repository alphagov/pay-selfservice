'use strict'

// NPM dependencies
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const sinon = require('sinon')

// Local dependencies
const paths = require('../../paths')
const checkCompanyNumberNotSubmitted = require('./check-company-number-not-submitted')

// Global setup
chai.use(chaiAsPromised)
const { expect } = chai // must be called after chai.use(chaiAsPromised) to use "should.eventually"

describe('Check "Company registration number" not submitted middleware', () => {
  let req
  let res
  let next

  beforeEach(() => {
    req = {
      correlationId: 'correlation-id',
      account: {
        gateway_account_id: '1',
        connectorGatewayAccountStripeProgress: {}
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

  it('should call next when "Company number" flag is false', done => {
    req.account.connectorGatewayAccountStripeProgress.companyNumber = false

    checkCompanyNumberNotSubmitted(req, res, next)

    setTimeout(() => {
      expect(next.calledOnce).to.be.true // eslint-disable-line
      expect(req.flash.notCalled).to.be.true // eslint-disable-line
      expect(res.redirect.notCalled).to.be.true // eslint-disable-line
      done()
    }, 250)
  })

  it('should redirect to the dashboard with error message when "Company number" flag is true', done => {
    req.account.connectorGatewayAccountStripeProgress.companyNumber = true

    checkCompanyNumberNotSubmitted(req, res, next)

    setTimeout(() => {
      expect(next.notCalled).to.be.true // eslint-disable-line
      expect(req.flash.calledWith('genericError', 'You’ve already provided your company registration number.<br />Contact GOV.UK Pay support if you need to update it.')).to.be.true // eslint-disable-line
      expect(res.redirect.calledWith(303, paths.dashboard.index)).to.be.true // eslint-disable-line
      done()
    }, 250)
  })

  it('should render an error page when req.account is undefined', done => {
    req.account = undefined

    checkCompanyNumberNotSubmitted(req, res, next)

    setTimeout(() => {
      expect(next.notCalled).to.be.true // eslint-disable-line
      expect(res.status.calledWith(500)).to.be.true // eslint-disable-line
      expect(res.render.calledWith('error', { message: 'Internal server error' })).to.be.true // eslint-disable-line
      done()
    }, 250)
  })

  it('should render an error page when req.account.connectorGatewayAccountStripeProgress is undefined', done => {
    req.account.connectorGatewayAccountStripeProgress = undefined

    checkCompanyNumberNotSubmitted(req, res, next)

    setTimeout(() => {
      expect(next.notCalled).to.be.true // eslint-disable-line
      expect(res.status.calledWith(500)).to.be.true // eslint-disable-line
      expect(res.render.calledWith('error', { message: 'Please try again or contact support team' })).to.be.true // eslint-disable-line
      done()
    }, 250)
  })
})
