'use strict'

const chai = require('chai')

const chaiAsPromised = require('chai-as-promised')
const sinon = require('sinon')

const { expect } = chai
chai.use(chaiAsPromised)

const paths = require('../../../paths')
const getController = require('./get-controller')

describe('get controller', () => {
  let req
  let res

  beforeEach(() => {
    req = {
      account: {
        gateway_account_id: 'gatewayId',
        connectorGatewayAccountStripeProgress: {}
      },
      correlationId: 'requestId'
    }
    res = {
      setHeader: sinon.stub(),
      status: sinon.spy(),
      redirect: sinon.spy(),
      render: sinon.spy()
    }
  })

  it('should redirect to bank account setup page', async () => {
    req.account.connectorGatewayAccountStripeProgress.bankAccount = false
    getController(req, res)
    sinon.assert.calledWith(res.redirect, 303, paths.stripeSetup.bankDetails)
  })

  it('should redirect to responsible person page', async () => {
    req.account.connectorGatewayAccountStripeProgress.bankAccount = true
    getController(req, res)
    sinon.assert.calledWith(res.redirect, 303, paths.stripeSetup.responsiblePerson)
  })

  it('should redirect to VAT number page', async () => {
    req.account.connectorGatewayAccountStripeProgress = {
      bankAccount: true,
      responsiblePerson: true
    }
    getController(req, res)
    sinon.assert.calledWith(res.redirect, 303, paths.stripeSetup.vatNumber)
  })

  it('should redirect to company registration number page', async () => {
    req.account.connectorGatewayAccountStripeProgress = {
      bankAccount: true,
      responsiblePerson: true,
      vatNumber: true
    }
    getController(req, res)
    sinon.assert.calledWith(res.redirect, 303, paths.stripeSetup.companyNumber)
  })

  it('should render go live complete page when all steps are completed', async () => {
    req.account.connectorGatewayAccountStripeProgress = {
      bankAccount: true,
      responsiblePerson: true,
      vatNumber: true,
      companyNumber: true
    }
    getController(req, res)
    sinon.assert.calledWith(res.render, 'stripe-setup/go-live-complete')
  })

  it('should render an error page when req.account is undefined', done => {
    req.account = undefined

    getController(req, res)

    setTimeout(() => {
      expect(res.status.calledWith(500)).to.be.true // eslint-disable-line
      expect(res.render.calledWith('error', { message: 'Please try again or contact support team' })).to.be.true // eslint-disable-line
      done()
    }, 250)
  })

  it('should render an error page when req.account.connectorGatewayAccountStripeProgress is undefined', done => {
    req.account.connectorGatewayAccountStripeProgress = undefined

    getController(req, res)

    setTimeout(() => {
      expect(res.status.calledWith(500)).to.be.true // eslint-disable-line
      expect(res.render.calledWith('error', { message: 'Please try again or contact support team' })).to.be.true // eslint-disable-line
      done()
    }, 250)
  })
})
