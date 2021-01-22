'use strict'

const sinon = require('sinon')
const checkCompanyNumberNotSubmitted = require('./check-company-number-not-submitted')

const accountExternalId = 'an-external-id'

describe('Check "Company registration number" not submitted middleware', () => {
  let req
  let res
  let next

  beforeEach(() => {
    req = {
      correlationId: 'correlation-id',
      account: {
        gateway_account_id: '1',
        external_id: accountExternalId,
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

  it('should call next when "Company number" flag is false', async () => {
    req.account.connectorGatewayAccountStripeProgress.companyNumber = false

    await checkCompanyNumberNotSubmitted(req, res, next)
    sinon.assert.calledOnce(next)
    sinon.assert.notCalled(req.flash)
    sinon.assert.notCalled(res.redirect)
  })

  it('should redirect to the dashboard with error message when "Company number" flag is true', async () => {
    req.account.connectorGatewayAccountStripeProgress.companyNumber = true

    await checkCompanyNumberNotSubmitted(req, res, next)
    sinon.assert.notCalled(next)
    sinon.assert.calledWith(req.flash, 'genericError', 'You’ve already provided your company registration number. Contact GOV.UK Pay support if you need to update it.')
    sinon.assert.calledWith(res.redirect, 303, `/account/${accountExternalId}/dashboard`)
  })

  it('should render an error page when req.account is undefined', async () => {
    req.account = undefined

    await checkCompanyNumberNotSubmitted(req, res, next)
    sinon.assert.notCalled(next)
    sinon.assert.calledWith(res.status, 500)
    sinon.assert.calledWith(res.render, 'error')
  })

  it('should render an error page when req.account.connectorGatewayAccountStripeProgress is undefined', async () => {
    req.account.connectorGatewayAccountStripeProgress = undefined

    await checkCompanyNumberNotSubmitted(req, res, next)
    sinon.assert.notCalled(next)
    sinon.assert.calledWith(res.status, 500)
    sinon.assert.calledWith(res.render, 'error')
  })
})
