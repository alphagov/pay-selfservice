'use strict'

const sinon = require('sinon')
const paths = require('../../paths')
const checkBankDetailsNotSubmitted = require('./check-bank-details-not-submitted')

describe('Check bank details not submitted middleware', () => {
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

  it('should call next when bank account flag is false', async () => {
    req.account.connectorGatewayAccountStripeProgress.bankAccount = false

    await checkBankDetailsNotSubmitted(req, res, next)
    sinon.assert.calledOnce(next)
    sinon.assert.notCalled(req.flash)
    sinon.assert.notCalled(res.redirect)
  })

  it('should redirect to the dashboard with error message when bank account flag is true', async () => {
    req.account.connectorGatewayAccountStripeProgress.bankAccount = true

    await checkBankDetailsNotSubmitted(req, res, next)
    sinon.assert.notCalled(next)
    sinon.assert.calledWith(req.flash, 'genericError', 'You’ve already provided your bank details. Contact GOV.UK Pay support if you need to update them.')
    sinon.assert.calledWith(res.redirect, 303, paths.dashboard.index)
  })

  it('should render an error page when req.account is undefined', async () => {
    req.account = undefined

    await checkBankDetailsNotSubmitted(req, res, next)
    sinon.assert.notCalled(next)
    sinon.assert.calledWith(res.status, 500)
    sinon.assert.calledWith(res.render, 'error')
  })

  it('should render an error page when req.account.connectorGatewayAccountStripeProgress', async () => {
    req.account.connectorGatewayAccountStripeProgress = undefined

    await checkBankDetailsNotSubmitted(req, res, next)
    sinon.assert.notCalled(next)
    sinon.assert.calledWith(res.status, 500)
    sinon.assert.calledWith(res.render, 'error')
  })
})
