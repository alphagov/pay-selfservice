'use strict'

const sinon = require('sinon')

const gatewayAccountFixture = require('../../../../test/fixtures/gateway-account.fixtures')
process.env.COLLECT_ADDITIONAL_KYC_DATA = true

const getController = require('./get.controller')

describe('get controller', () => {
  let req, res, next

  beforeEach(() => {
    const account = gatewayAccountFixture.validGatewayAccount({
      gateway_account_id: 'gatewayId',
      external_id: 'a-valid-external-id',
      gateway_account_credentials: [{
        external_id: 'a-valid-credential-id'
      }]
    })
    account.connectorGatewayAccountStripeProgress = {}
    req = {
      account,
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

  after(() => {
    process.env.COLLECT_ADDITIONAL_KYC_DATA = false
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
      responsiblePerson: true,
      director: true
    }
    await getController(req, res, next)
    sinon.assert.calledWith(res.redirect, 303, `/account/${req.account.external_id}/your-psp/${req.credentialId}/vat-number`)
  })

  it('should redirect to company registration number page', async () => {
    req.account.connectorGatewayAccountStripeProgress = {
      bankAccount: true,
      responsiblePerson: true,
      vatNumber: true,
      director: true
    }
    await getController(req, res, next)
    sinon.assert.calledWith(res.redirect, 303, `/account/${req.account.external_id}/your-psp/${req.credentialId}/company-number`)
  })

  it('should render go live complete page when all steps are completed', async () => {
    req.account.connectorGatewayAccountStripeProgress = {
      bankAccount: true,
      responsiblePerson: true,
      vatNumber: true,
      companyNumber: true,
      director: true
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

  describe('COLLECT_ADDITIONAL_KYC_DATA environment variable enabled', () => {
    it('should redirect to director page', async function () {
      req.account.connectorGatewayAccountStripeProgress = {
        bankAccount: true,
        responsiblePerson: true,
        director: false,
        vatNumber: false,
        companyNumber: false
      }
      await getController(req, res, next)
      sinon.assert.calledWith(res.redirect, 303, `/account/${req.account.external_id}/your-psp/${req.credentialId}/director`)
    })
  })
})
