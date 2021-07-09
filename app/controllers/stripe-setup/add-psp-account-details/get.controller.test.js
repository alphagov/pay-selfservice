'use strict'

const sinon = require('sinon')

const getController = require('./get.controller')

describe('get controller', () => {
  let req, res, next

  beforeEach(() => {
    req = {
      account: {
        gateway_account_id: 'gatewayId',
        external_id: 'a-valid-external-id',
        connectorGatewayAccountStripeProgress: {}
      },
      credentialId: 'a-valid-credential-id',
      correlationId: 'requestId'
    }
    res = {
      setHeader: sinon.stub(),
      status: sinon.spy(),
      redirect: sinon.spy(),
      render: sinon.spy()
    }
    next = sinon.spy()
  })

  it('should redirect to bank account setup page', async () => {
    req.account.connectorGatewayAccountStripeProgress.bankAccount = false
    await getController(req, res, next)
    sinon.assert.calledWith(res.redirect, 303, `/account/${req.account.external_id}/your-psp/${req.credentialId}/bank-details`)
  })

  it('should redirect to responsible person page', async () => {
    req.account.connectorGatewayAccountStripeProgress.bankAccount = true
    await getController(req, res, next)
    sinon.assert.calledWith(res.redirect, 303, `/account/${req.account.external_id}/your-psp/${req.credentialId}/responsible-person`)
  })

  it('should redirect to VAT number page', async () => {
    req.account.connectorGatewayAccountStripeProgress = {
      bankAccount: true,
      responsiblePerson: true
    }
    await getController(req, res, next)
    sinon.assert.calledWith(res.redirect, 303, `/account/${req.account.external_id}/your-psp/${req.credentialId}/vat-number`)
  })

  it('should redirect to company registration number page', async () => {
    req.account.connectorGatewayAccountStripeProgress = {
      bankAccount: true,
      responsiblePerson: true,
      vatNumber: true
    }
    await getController(req, res, next)
    sinon.assert.calledWith(res.redirect, 303, `/account/${req.account.external_id}/your-psp/${req.credentialId}/company-number`)
  })

  it('should render go live complete page when all steps are completed', async () => {
    req.account.connectorGatewayAccountStripeProgress = {
      bankAccount: true,
      responsiblePerson: true,
      vatNumber: true,
      companyNumber: true
    }
    await getController(req, res, next)
    sinon.assert.calledWith(res.render, 'stripe-setup/go-live-complete')
  })

  it('should render an error page when req.account is undefined', async () => {
    req.account = undefined

    await getController(req, res, next)
    const expectedError = sinon.match.instanceOf(Error)
      .and(sinon.match.has('message', 'Stripe setup progress is not available on request'))
    sinon.assert.calledWith(next, expectedError)
    sinon.assert.notCalled(res.render)
  })

  it('should render an error page when req.account.connectorGatewayAccountStripeProgress is undefined', async () => {
    req.account.connectorGatewayAccountStripeProgress = undefined

    await getController(req, res, next)
    const expectedError = sinon.match.instanceOf(Error)
      .and(sinon.match.has('message', 'Stripe setup progress is not available on request'))
    sinon.assert.calledWith(next, expectedError)
    sinon.assert.notCalled(res.render)
  })
})
