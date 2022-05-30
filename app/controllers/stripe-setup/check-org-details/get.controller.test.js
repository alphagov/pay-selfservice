'use strict'

const sinon = require('sinon')
const getController = require('./get.controller')

describe('Check org details - get controller', () => {
  let req
  let res
  let next

  beforeEach(() => {
    req = {
      correlationId: 'correlation-id',
      account: {
        gateway_account_id: '1',
        external_id: 'a-valid-external-id',
        connectorGatewayAccountStripeProgress: {}
      },
      flash: sinon.spy()
    }
    res = {
      redirect: sinon.spy(),
      render: sinon.spy()
    }
    next = sinon.spy()
  })

  it('should render error page when stripe setup is not available on request', async () => {
    req.account.connectorGatewayAccountStripeProgress = undefined

    await getController(req, res, next)

    sinon.assert.notCalled(res.redirect)
    const expectedError = sinon.match.instanceOf(Error)
      .and(sinon.match.has('message', 'Stripe setup progress is not available on request'))
    sinon.assert.calledWith(next, expectedError)
  })

  it('should render error if organisation details have already been submitted', async () => {
    req.account.connectorGatewayAccountStripeProgress = { organisationDetails: true }

    await getController(req, res)

    sinon.assert.calledWith(res.render, 'error-with-link')
  })

  it('should render `check your organisation` form if details are not yet submitted', async () => {
    req.account.connectorGatewayAccountStripeProgress = { organisationDetails: false }

    await getController(req, res)

    sinon.assert.calledWith(res.render, `stripe-setup/check-org-details/index`)
  })
})
