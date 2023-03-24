'use strict'

const sinon = require('sinon')
const getController = require('./get.controller')

describe('Org URL GET controller', () => {
  let req
  let res
  let next

  beforeEach(() => {
    req = {
      account: {
        external_id: 'a-valid-external-id',
        connectorGatewayAccountStripeProgress: {}
      },
      flash: sinon.spy(),
      url: '/switch-psp/'
    }
    res = {
      redirect: sinon.spy(),
      render: sinon.spy()
    }
    next = sinon.spy()
  })

  it('should render organisation URL details form', async () => {
    await getController(req, res, next)

    sinon.assert.calledWith(res.render, `switch-psp/organisation-url`)
  })
})
