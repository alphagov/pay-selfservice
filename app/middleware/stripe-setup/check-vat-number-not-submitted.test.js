'use strict'

const sinon = require('sinon')
const paths = require('../../paths')
const checkVatNumberNotSubmitted = require('./check-vat-number-not-submitted')

describe('Check "VAT number" not submitted middleware', () => {
  let req
  let res
  let next

  beforeEach(() => {
    req = {
      correlationId: 'correlation-id',
      account: {
        gateway_account_id: '1',
        external_id: 'some-external-id',
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

  it('should call next when "VAT number" flag is false', async () => {
    req.account.connectorGatewayAccountStripeProgress.vatNumber = false

    await checkVatNumberNotSubmitted(req, res, next)
    sinon.assert.calledOnce(next)
    sinon.assert.notCalled(req.flash)
    sinon.assert.notCalled(res.redirect)
  })

  it('should redirect to the dashboard with error message when "VAT number" flag is true', async () => {
    req.account.connectorGatewayAccountStripeProgress.vatNumber = true

    await checkVatNumberNotSubmitted(req, res, next)
    sinon.assert.notCalled(next)
    sinon.assert.calledWith(req.flash, 'genericError', 'You’ve already provided your VAT number. Contact GOV.UK Pay support if you need to update it.')
    sinon.assert.calledWith(res.redirect, 303, paths.account.formatPathFor(paths.account.dashboard.index, 'some-external-id'))
  })

  it('should render an error page when req.account is undefined', async () => {
    req.account = undefined

    await checkVatNumberNotSubmitted(req, res, next)
    sinon.assert.notCalled(next)
    sinon.assert.calledWith(res.status, 500)
    sinon.assert.calledWith(res.render, 'error')
  })

  it('should render an error page when req.accoun.connectorGatewayAccountStripeProgress is undefined', async () => {
    req.account.connectorGatewayAccountStripeProgress = undefined

    await checkVatNumberNotSubmitted(req, res, next)
    sinon.assert.notCalled(next)
    sinon.assert.calledWith(res.status, 500)
    sinon.assert.calledWith(res.render, 'error')
  })
})
