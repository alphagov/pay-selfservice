'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { expect } = require('chai')
const paths = require('../../../paths')

describe('Company number POST controller', () => {
  const postBody = {
    'company-number-declaration': 'true',
    'company-number': '01234567'
  }

  let req
  let next
  let res
  let setStripeAccountSetupFlagMock
  let updateCompanyMock

  function getControllerWithMocks () {
    return proxyquire('./post.controller', {
      '../../../services/clients/stripe/stripe.client': {
        updateCompany: updateCompanyMock
      },
      '../../../services/clients/connector.client': {
        ConnectorClient: function () {
          this.setStripeAccountSetupFlag = setStripeAccountSetupFlagMock
        }
      },
      '../stripe-setup.util': {
        getStripeAccountId: () => {
          return Promise.resolve('acct_123example123')
        }
      }
    })
  }

  beforeEach(() => {
    req = {
      account: {
        gateway_account_id: '1',
        external_id: 'a-valid-external-id',
        connectorGatewayAccountStripeProgress: {},
        gateway_account_credentials: [
          { external_id: 'a-valid-credential-external-id' }
        ]
      },
      body: postBody,
      params: {
        credentialId: 'a-valid-credential-external-id'
      },
      flash: sinon.spy()
    }
    res = {
      setHeader: sinon.stub(),
      status: sinon.spy(),
      redirect: sinon.spy(),
      render: sinon.spy(),
      locals: {
        stripeAccount: {
          stripeAccountId: 'acct_123example123'
        }
      }
    }
    next = sinon.spy()
  })

  it('should call Stripe with company number, then connector, then redirect to add psp account details route', async function () {
    updateCompanyMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    req.body = { ...postBody }

    await controller(req, res, next)

    sinon.assert.calledWith(updateCompanyMock, res.locals.stripeAccount.stripeAccountId, {
      'tax_id': '01234567'
    })
    sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'company_number')
    sinon.assert.calledWith(res.redirect, 303, `/account/a-valid-external-id${paths.account.stripe.addPspAccountDetails}`)
  })

  it('should NOT call Stripe if company number is not provided, but update connector, then redirect to add psp account details route', async function () {
    updateCompanyMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    req.body = {
      'company-number-declaration': 'false'
    }

    await controller(req, res, next)

    sinon.assert.notCalled(updateCompanyMock)
    sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'company_number')
    sinon.assert.calledWith(res.redirect, 303, `/account/a-valid-external-id${paths.account.stripe.addPspAccountDetails}`)
  })

  it('should render error page when stripe setup is not available on request', async () => {
    const controller = getControllerWithMocks()
    req.account.connectorGatewayAccountStripeProgress = undefined

    await controller(req, res, next)

    sinon.assert.notCalled(res.redirect)
    const expectedError = sinon.match.instanceOf(Error)
      .and(sinon.match.has('message', 'Stripe setup progress is not available on request'))
    sinon.assert.calledWith(next, expectedError)
  })

  it('should render error if company number is already provided ', async () => {
    const controller = getControllerWithMocks()
    req.account.connectorGatewayAccountStripeProgress = { companyNumber: true }

    await controller(req, res, next)

    sinon.assert.calledWith(res.render, 'error-with-link')
  })

  it('should render error when Stripe returns error, not call connector, and not redirect', async function () {
    updateCompanyMock = sinon.spy(() => Promise.reject(new Error()))
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    req.body = { ...postBody }

    await controller(req, res, next)

    sinon.assert.called(updateCompanyMock)
    sinon.assert.notCalled(setStripeAccountSetupFlagMock)
    sinon.assert.notCalled(res.redirect)
    const expectedError = sinon.match.instanceOf(Error)
    sinon.assert.calledWith(next, expectedError)
  })

  it('should render error when connector returns error', async function () {
    updateCompanyMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.reject(new Error()))
    const controller = getControllerWithMocks()

    req.body = { ...postBody }

    await controller(req, res, next)

    sinon.assert.called(updateCompanyMock)
    sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'company_number')
    sinon.assert.notCalled(res.redirect)
    const expectedError = sinon.match.instanceOf(Error)
    sinon.assert.calledWith(next, expectedError)
  })

  it('should render error when connector returns error when ENABLE_STRIPE_ONBOARDING_TASK_LIST is true and on the your-psp route', async function () {
    process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'true'

    req.url = '/your-psp/:credentialId/company-number'

    updateCompanyMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.reject(new Error()))
    const controller = getControllerWithMocks()

    req.body = {}

    await controller(req, res, next)

    sinon.assert.calledWith(res.render, `stripe-setup/company-number/index`)
    const pageData = res.render.firstCall.args[1]
    expect(pageData.enableStripeOnboardingTaskList).to.equal(true)
    expect(pageData.currentCredential.external_id).to.equal('a-valid-credential-external-id')
  })

  it('should redirect to the task list page when ENABLE_STRIPE_ONBOARDING_TASK_LIST is set to true ', async function () {
    process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'true'
    req.url = '/your-psp/:credentialId/company-number'

    updateCompanyMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    await controller(req, res, next)

    sinon.assert.calledWith(updateCompanyMock)
    sinon.assert.calledWith(setStripeAccountSetupFlagMock)
    sinon.assert.calledWith(res.redirect, 303, `/account/a-valid-external-id/your-psp/a-valid-credential-external-id`)
  })

  it('should redirect to add psp account details route when ENABLE_STRIPE_ONBOARDING_TASK_LIST is set to false ', async function () {
    process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'false'

    updateCompanyMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    await controller(req, res, next)

    sinon.assert.calledWith(updateCompanyMock)
    sinon.assert.calledWith(setStripeAccountSetupFlagMock)
    sinon.assert.calledWith(res.redirect, 303, `/account/a-valid-external-id/stripe/add-psp-account-details`)
  })
})
