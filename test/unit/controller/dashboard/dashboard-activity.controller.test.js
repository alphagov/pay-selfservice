'use strict'

const sinon = require('sinon')
const dashboardController = require('../../../../app/controllers/dashboard/dashboard-activity.controller')
const User = require('../../../../app/models/User.class')
const { validUser } = require('../../../fixtures/user.fixtures')
const { validGatewayAccountResponse } = require('../../../fixtures/gateway-account.fixtures')
const { ConnectorClient } = require('../../../../app/services/clients/connector.client')
const StripeClient = require('../../../../app/services/clients/stripe/stripe.client.js')

describe('Controller: Dashboard activity', () => {
  const externalServiceId = 'service-external-id'
  const serviceGatewayAccountIds = ['2', '5']
  let req, res, accountSpy, stripeSpy

  describe('Stripe test account', () => {
    before(() => {
      const user = new User(validUser({
        username: 'valid-user',
        service_roles: [{
          service: {
            external_id: externalServiceId,
            gateway_account_ids: serviceGatewayAccountIds
          }
        }]
      }))

      const account = validGatewayAccountResponse({
        payment_provider: 'stripe',
        type: 'test'
      })

      req = {
        account,
        service: {
          currentGoLiveStage: null
        },
        user
      }

      res = {
        status: sinon.spy(),
        render: sinon.spy()
      }
    })

    after(() => {
      accountSpy.restore()
      stripeSpy.restore()
    })

    it('should not call call the Connector client or the Stripe client', async () => {
      accountSpy = sinon.stub(ConnectorClient.prototype, 'getStripeAccount')
      stripeSpy = sinon.stub(StripeClient, 'retrieveAccountDetails')

      await dashboardController(req, res)

      sinon.assert.notCalled(accountSpy)
      sinon.assert.notCalled(stripeSpy)
    })
  })
})
