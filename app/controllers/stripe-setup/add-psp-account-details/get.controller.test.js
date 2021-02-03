'use strict'

const sinon = require('sinon')

const paths = require('../../../paths')
const getController = require('./get.controller')

describe('get controller', () => {
  let req
  let res

  beforeEach(() => {
    req = {
      account: {
        gateway_account_id: 'gatewayId',
        external_id: 'a-valid-external-id',
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
    await getController(req, res)
    sinon.assert.calledWith(res.redirect, 303, `/account/a-valid-external-id${paths.account.stripeSetup.bankDetails}`)
  })

  it('should redirect to responsible person page', async () => {
    req.account.connectorGatewayAccountStripeProgress.bankAccount = true
    await getController(req, res)
    sinon.assert.calledWith(res.redirect, 303, `/account/a-valid-external-id${paths.account.stripeSetup.responsiblePerson}`)
  })

  it('should redirect to VAT number page', async () => {
    req.account.connectorGatewayAccountStripeProgress = {
      bankAccount: true,
      responsiblePerson: true
    }
    await getController(req, res)
    sinon.assert.calledWith(res.redirect, 303, `/account/a-valid-external-id${paths.account.stripeSetup.vatNumber}`)
  })

  it('should redirect to company registration number page', async () => {
    req.account.connectorGatewayAccountStripeProgress = {
      bankAccount: true,
      responsiblePerson: true,
      vatNumber: true
    }
    await getController(req, res)
    sinon.assert.calledWith(res.redirect, 303, `/account/a-valid-external-id${paths.account.stripeSetup.companyNumber}`)
  })

  it('should render go live complete page when all steps are completed', async () => {
    req.account.connectorGatewayAccountStripeProgress = {
      bankAccount: true,
      responsiblePerson: true,
      vatNumber: true,
      companyNumber: true
    }
    await getController(req, res)
    sinon.assert.calledWith(res.render, 'stripe-setup/go-live-complete')
  })

  it('should render an error page when req.account is undefined', async () => {
    req.account = undefined

    await getController(req, res)
    sinon.assert.calledWith(res.status, 500)
    sinon.assert.calledWith(res.render, 'error', sinon.match({ message: 'Please try again or contact support team' }))
  })

  it('should render an error page when req.account.connectorGatewayAccountStripeProgress is undefined', async () => {
    req.account.connectorGatewayAccountStripeProgress = undefined

    await getController(req, res)
    sinon.assert.calledWith(res.status, 500)
    sinon.assert.calledWith(res.render, 'error', sinon.match({ message: 'Please try again or contact support team' }))
  })
})
