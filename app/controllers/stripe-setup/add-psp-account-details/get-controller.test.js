'use strict'

const sinon = require('sinon')
const proxyquire = require('proxyquire')
const paths = require('../../../paths')

const getController = function getController (stripeAccountSetupResponse) {
  return proxyquire('./get-controller', {
    '../../../services/clients/connector_client': {
      ConnectorClient: function () {
        this.getStripeAccountSetup = (gatewayAccountId, correlationId) => Promise.resolve(stripeAccountSetupResponse)
      }
    }
  })
}

describe('get controller', () => {
  const req = {
    account: {
      gateway_account_id: 'gatewayId'
    },
    correlationId: 'requestId'
  }

  let res

  beforeEach(() => {
    res = {
      setHeader: sinon.stub(),
      status: sinon.spy(),
      redirect: sinon.spy(),
      render: sinon.spy()
    }
  })

  it('should redirect to bank account setup page', async () => {
    const controller = getController({
      bankAccount: false,
      responsiblePerson: false,
      vatNumberCompanyNumber: false
    })
    await controller(req, res)
    sinon.assert.calledWith(res.redirect, 303, paths.stripeSetup.bankDetails)
  })

  it('should redirect to responsible person page', async () => {
    const controller = getController({
      bankAccount: true,
      responsiblePerson: false,
      vatNumberCompanyNumber: false
    })
    await controller(req, res)
    sinon.assert.calledWith(res.redirect, 303, paths.stripeSetup.responsiblePerson)
  })

  it('should redirect to VAT number page', async () => {
    const controller = getController({
      bankAccount: true,
      responsiblePerson: true,
      vatNumberCompanyNumber: false
    })
    await controller(req, res)
    sinon.assert.calledWith(res.redirect, 303, paths.stripeSetup.vatNumberCompanyNumber)
  })

  it('should render go live complete page when all steps are completed', async () => {
    const controller = getController({
      bankAccount: true,
      responsiblePerson: true,
      vatNumberCompanyNumber: true
    })
    await controller(req, res)
    sinon.assert.calledWith(res.render, 'stripe-setup/go-live-complete')
  })
})
