'use strict'

const sinon = require('sinon')
const paths = require('../../paths')
const checkResponsiblePersonNotSubmitted = require('./check-responsible-person-not-submitted')

describe('Check responsible person not submitted middleware', () => {
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

  it('should call next when responsible person flag is false', async () => {
    req.account.connectorGatewayAccountStripeProgress.responsiblePerson = false

    await checkResponsiblePersonNotSubmitted(req, res, next)
    sinon.assert.calledOnce(next)
    sinon.assert.notCalled(req.flash)
    sinon.assert.notCalled(res.redirect)
  })

  it('should redirect to the dashboard with error message when responsible person flag is true', async () => {
    req.account.connectorGatewayAccountStripeProgress.responsiblePerson = true

    await checkResponsiblePersonNotSubmitted(req, res, next)
    sinon.assert.notCalled(next)
    sinon.assert.calledWith(req.flash, 'genericError', 'You’ve already nominated your responsible person. Contact GOV.UK Pay support if you need to change them.')
    sinon.assert.calledWith(res.redirect, 303, paths.account.formatPathFor(paths.account.dashboard.index, 'some-external-id'))
  })

  it('should render an error page when req.account is undefined', async () => {
    req.account = undefined

    await checkResponsiblePersonNotSubmitted(req, res, next)
    sinon.assert.notCalled(next)
    sinon.assert.calledWith(res.status, 500)
    sinon.assert.calledWith(res.render, 'error')
  })

  it('should render an error page when req.account.connectorGatewayAccountStripeProgress is undefined', async () => {
    req.account.connectorGatewayAccountStripeProgress = undefined

    await checkResponsiblePersonNotSubmitted(req, res, next)
    sinon.assert.notCalled(next)
    sinon.assert.calledWith(res.status, 500)
    sinon.assert.calledWith(res.render, 'error')
  })
})
