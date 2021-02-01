'use strict'

const sinon = require('sinon')
const getController = require('./get.controller')

describe('Responsible person GET controller', () => {
  let req
  let res
  let next

  beforeEach(() => {
    req = {
      correlationId: 'correlation-id',
      account: {
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

  it('should redirect to dashboard if responsible person details are already provided ', async () => {
    req.account.connectorGatewayAccountStripeProgress = { responsiblePerson: true }

    await getController(req, res)

    sinon.assert.calledWith(req.flash, 'genericError', 'You’ve already nominated your responsible person. Contact GOV.UK Pay support if you need to change them.')
    sinon.assert.calledWith(res.redirect, 303, `/account/a-valid-external-id/dashboard`)
  })

  it('should render error page when stripe setup is not available on request', async () => {
    req.account.connectorGatewayAccountStripeProgress = undefined

    await getController(req, res, next)

    sinon.assert.notCalled(res.redirect)
    const expectedError = sinon.match.instanceOf(Error)
      .and(sinon.match.has('message', 'Stripe setup progress is not available on request'))
    sinon.assert.calledWith(next, expectedError)
  })

  it('should render responsible person details form if details are not yet submitted', async () => {
    req.account.connectorGatewayAccountStripeProgress = { responsiblePerson: false }

    await getController(req, res)

    sinon.assert.calledWith(res.render, `stripe-setup/responsible-person/index`)
  })
})
