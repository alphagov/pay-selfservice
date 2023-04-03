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
  const credential = {
    state: 'ACTIVE',
    payment_provider: 'stripe',
    id: 100,
    external_id: credentialId,
    credentials: { stripe_account_id: 'stripe_account_id' }
  }
  beforeEach(() => {
    const account = gatewayAccountFixtures.validGatewayAccount({
      gateway_account_credentials: [
        credential
      ]
    })

    req = {
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

  afterEach(() => {
    process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = undefined
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

  it('should get stripe taskList', async () => {
    await getController(req, res, next)

    const pageData = res.render.args[0][1]

    expect(pageData.taskList).to.deep.equal({
      ENTER_BANK_DETAILS: { enabled: true, completed: false },
      ENTER_RESPONSIBLE_PERSON: { enabled: true, completed: false },
      ENTER_DIRECTOR: { enabled: true, completed: false },
      ENTER_VAT_NUMBER: { enabled: true, completed: false },
      ENTER_COMPANY_NUMBER: { enabled: true, completed: false },
      CONFIRM_ORGANISATION_DETAILS: { enabled: true, completed: false },
      UPLOAD_GOVERNMENT_ENTITY_DOCUMENT: { enabled: false, completed: false }
    })
    expect(pageData.taskListIsComplete).to.equal(false)
    expect(Object.keys(pageData.taskList).length).to.equal(7)
    sinon.assert.calledWith(res.render, 'your-psp/index')
  })
})

