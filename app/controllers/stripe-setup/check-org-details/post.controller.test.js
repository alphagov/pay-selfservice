'use strict'

const sinon = require('sinon')
const { expect } = require('chai')
const controller = require('./post.controller')

describe('Check org details - post controller', () => {
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
      setHeader: sinon.stub(),
      status: sinon.spy(),
      redirect: sinon.spy(),
      render: sinon.spy()
    }

    next = sinon.spy()
  })

  it('should render error page when stripe setup is not available on request', async () => {
    req.account.connectorGatewayAccountStripeProgress = undefined

    controller(req, res, next)

    sinon.assert.notCalled(res.redirect)
    const expectedError = sinon.match.instanceOf(Error)
      .and(sinon.match.has('message', 'Stripe setup progress is not available on request'))
    sinon.assert.calledWith(next, expectedError)
  })

  it('when organisation details are already provided, should display an error', async () => {
    req.account.connectorGatewayAccountStripeProgress = { organisationDetails: true }

    controller(req, res, next)

    sinon.assert.calledWith(res.render, 'error-with-link')
  })

  it('when no radio button is selected, then it should display the page with an error', async () => {
    req.account.connectorGatewayAccountStripeProgress = { organisationDetails: false }

    controller(req, res, next)

    sinon.assert.calledWith(res.render, `stripe-setup/check-org-details/index`)

    const renderArgs = res.render.getCalls()[0]
    expect(renderArgs.args[0]).to.equal('stripe-setup/check-org-details/index')
    expect(renderArgs.args[1].errors['confirmOrgDetails']).to.equal('Select yes if your organisation’s details match the details on your government entity document')
  })
})
