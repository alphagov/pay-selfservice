'use strict'

const sinon = require('sinon')
const dashboardController = require('./dashboard-activity.controller')
const User = require('../../models/User.class')
const { validUser } = require('../../../test/fixtures/user.fixtures')
const { validGatewayAccountResponse } = require('../../../test/fixtures/gateway-account.fixtures')
const { ConnectorClient } = require('../../services/clients/connector.client')
const StripeClient = require('../../services/clients/stripe/stripe.client.js')
const { expect } = require('chai')

describe('Controller: Dashboard activity', () => {
  const externalServiceId = 'service-external-id'
  const serviceGatewayAccountIds = [ '2', '5' ]
  let req, res, accountSpy, stripeSpy

  describe('Stripe test account', () => {
    beforeEach(() => {
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

    afterEach(() => {
      accountSpy.restore()
      stripeSpy.restore()

      process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = undefined
    })

    it(`should not call call the Connector client or the Stripe client`, async () => {
      accountSpy = sinon.stub(ConnectorClient.prototype, 'getStripeAccount')
      stripeSpy = sinon.stub(StripeClient, 'retrieveAccountDetails')

      await dashboardController(req, res)

      sinon.assert.notCalled(accountSpy)
      sinon.assert.notCalled(stripeSpy)
    })

    it('should set enableStripeOnboardingTaskList to true when ENABLE_STRIPE_ONBOARDING_TASK_LIST is true', async () => {
      process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'true'

      await dashboardController(req, res)
      const pageData = res.render.args[0][1]
      expect(pageData.enableStripeOnboardingTaskList).to.equal(true)
    })

    it('should set enableStripeOnboardingTaskList to false when ENABLE_STRIPE_ONBOARDING_TASK_LIST is false', async () => {
      process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'false'

      await dashboardController(req, res)

      const pageData = res.render.args[0][1]
      expect(pageData.enableStripeOnboardingTaskList).to.equal(false)
    })
  })
})
