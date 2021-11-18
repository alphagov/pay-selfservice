'use strict'

const sinon = require('sinon')
const getController = require('./get.controller')

describe('Org URL GET controller', () => {
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
      flash: sinon.spy(),
      url: '/kyc/'
    }
    res = {
      redirect: sinon.spy(),
      render: sinon.spy()
    }
    next = sinon.spy()
  })

  it('should render error page when on a /kyc/ URL and req.account.requires_additional_kyc_data = false', async () => {
    req.account.requires_additional_kyc_data = undefined

    await getController(req, res, next)

    sinon.assert.notCalled(res.redirect)
    const expectedError = sinon.match.instanceOf(Error)
      .and(sinon.match.has('message', 'requires_additional_kyc_data flag is not enabled for gateway account'))
    sinon.assert.calledWith(next, expectedError)
  })

  it('should render organisation URL details form if req.account.requires_additional_kyc_data = true', async () => {
    req.account.requires_additional_kyc_data = true

    await getController(req, res, next)

    sinon.assert.calledWith(res.render, `kyc/organisation-url`)
  })
})
