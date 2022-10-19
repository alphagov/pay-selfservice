'use strict'

const sinon = require('sinon')
const getController = require('./get.controller')
const gatewayAccountFixtures = require('../../../test/fixtures/gateway-account.fixtures')
const { expect } = require('chai')
const credentialId = 'a-valid-credential-id'

describe('Your PSP GET controller', () => {
  let req
  let res
  let next
  const account = gatewayAccountFixtures.validGatewayAccount({
    gateway_account_credentials: [
      {
        state: 'ACTIVE',
        payment_provider: 'stripe',
        id: 100,
        external_id: credentialId
      }
    ]
  })

  beforeEach(() => {
    req = {
      correlationId: 'correlation-id',
      account: account,
      params: { credentialId },
      flash: sinon.spy(),
      url: '/your-psp/'
    }
    res = {
      redirect: sinon.spy(),
      render: sinon.spy()
    }
    next = sinon.spy()
  })

  it('should set enableStripeOnboardingTaskList to true when ENABLE_STRIPE_ONBOARDING_TASK_LIST is true', async () => {
    process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'true'

    await getController(req, res, next)

    const pageData = res.render.args[0][1]
    expect(pageData.enableStripeOnboardingTaskList).to.equal(true)
    sinon.assert.calledWith(res.render, 'your-psp/index')
  })

  it('should set enableStripeOnboardingTaskList to false when ENABLE_STRIPE_ONBOARDING_TASK_LIST is false', async () => {
    process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'false'

    await getController(req, res, next)

    const pageData = res.render.args[0][1]
    expect(pageData.enableStripeOnboardingTaskList).to.equal(false)
    sinon.assert.calledWith(res.render, 'your-psp/index')
  })

  it('should set enableStripeOnboardingTaskList to false when ENABLE_STRIPE_ONBOARDING_TASK_LIST is not set at all', async () => {
    process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = undefined

    await getController(req, res, next)

    const pageData = res.render.args[0][1]
    expect(pageData.enableStripeOnboardingTaskList).to.equal(false)
    sinon.assert.calledWith(res.render, 'your-psp/index')
  })
})
