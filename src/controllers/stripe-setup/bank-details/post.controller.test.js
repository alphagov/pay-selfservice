'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const paths = require('../../../paths')
const { expect } = require('chai')

describe('Bank details post controller', () => {
  const rawAccountNumber = '00012345'
  const rawSortCode = '10 - 88 - 00'
  const sanitisedAccountNumber = '00012345'
  const sanitisedSortCode = '108800'

  let req
  let res
  let next
  let setStripeAccountSetupFlagMock
  let updateBankAccountMock

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
      body: {
        'account-number': rawAccountNumber,
        'sort-code': rawSortCode,
        'answers-checked': true
      },
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

  it('should call stripe and connector and redirect to add psp account details redirect route', async () => {
    updateBankAccountMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    await controller(req, res, next)

    sinon.assert.calledWith(updateBankAccountMock, res.locals.stripeAccount.stripeAccountId, {
      bank_account_sort_code: sanitisedSortCode,
      bank_account_number: sanitisedAccountNumber
    })
    sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'bank_account')
    sinon.assert.calledWith(res.redirect, 303, `/account/a-valid-external-id${paths.account.stripe.addPspAccountDetails}`)
  })

  it('should render error page when Stripe returns unknown error', async () => {
    updateBankAccountMock = sinon.spy(() => Promise.reject(new Error()))
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    await controller(req, res, next)

    sinon.assert.calledWith(updateBankAccountMock, res.locals.stripeAccount.stripeAccountId, {
      bank_account_sort_code: sanitisedSortCode,
      bank_account_number: sanitisedAccountNumber
    })
    sinon.assert.notCalled(setStripeAccountSetupFlagMock)
    sinon.assert.notCalled(res.redirect)
    const expectedError = sinon.match.instanceOf(Error)
    sinon.assert.calledWith(next, expectedError)
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

  it('should render error if bank details are already provided ', async () => {
    const controller = getControllerWithMocks()
    req.account.connectorGatewayAccountStripeProgress = { bankAccount: true }

    await controller(req, res, next)

    sinon.assert.calledWith(res.render, 'error-with-link')
  })

  it('should re-render the form page when Stripe returns "routing_number_invalid" error', async () => {
    updateBankAccountMock = sinon.spy((stripeAccountId, body) => {
      return new Promise((resolve, reject) => {
        const error = new Error()
        error.code = 'routing_number_invalid'
        reject(error)
      })
    })
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    await controller(req, res, next)

    sinon.assert.calledWith(updateBankAccountMock, res.locals.stripeAccount.stripeAccountId, {
      bank_account_sort_code: sanitisedSortCode,
      bank_account_number: sanitisedAccountNumber
    })
    sinon.assert.notCalled(setStripeAccountSetupFlagMock)
    sinon.assert.notCalled(res.redirect)
    sinon.assert.called(res.render)
  })

  it('should re-render the form page when Stripe returns "account_number_invalid" error', async () => {
    updateBankAccountMock = sinon.spy((stripeAccountId, body) => {
      return new Promise((resolve, reject) => {
        const error = new Error()
        error.code = 'account_number_invalid'
        reject(error)
      })
    })
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    await controller(req, res, next)

    sinon.assert.calledWith(updateBankAccountMock, res.locals.stripeAccount.stripeAccountId, {
      bank_account_sort_code: sanitisedSortCode,
      bank_account_number: sanitisedAccountNumber
    })
    sinon.assert.notCalled(setStripeAccountSetupFlagMock)
    sinon.assert.notCalled(res.redirect)
    sinon.assert.called(res.render)
  })

  it('should render error page when connector returns error', async () => {
    updateBankAccountMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.reject(new Error()))
    const controller = getControllerWithMocks()

    await controller(req, res, next)

    sinon.assert.calledWith(updateBankAccountMock, res.locals.stripeAccount.stripeAccountId, {
      bank_account_sort_code: sanitisedSortCode,
      bank_account_number: sanitisedAccountNumber
    })
    sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'bank_account')
    sinon.assert.notCalled(res.redirect)
    const expectedError = sinon.match.instanceOf(Error)
    sinon.assert.calledWith(next, expectedError)
  })

  it('should redirect to the task list page when ENABLE_STRIPE_ONBOARDING_TASK_LIST is set to true ', async () => {
    process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'true'

    req.url = '/your-psp/:credentialId/bank-details'

    updateBankAccountMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    await controller(req, res, next)

    sinon.assert.calledWith(updateBankAccountMock)
    sinon.assert.calledWith(setStripeAccountSetupFlagMock)
    sinon.assert.calledWith(res.redirect, 303, '/account/a-valid-external-id/your-psp/a-valid-credential-external-id')
  })

  it('should render error page with side navigation when ENABLE_STRIPE_ONBOARDING_TASK_LIST is true and on the your-psp route', async () => {
    process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'true'

    req.url = '/your-psp/:credentialId/bank-details'
    req.body = {}

    const controller = getControllerWithMocks()

    await controller(req, res, next)

    const pageData = res.render.firstCall.args[1]

    sinon.assert.called(res.render)
    expect(pageData.enableStripeOnboardingTaskList).equal(true)
    expect(pageData.currentCredential).to.deep.equal({ external_id: 'a-valid-credential-external-id' })
  })

  it('should re-render the form page when Stripe returns "routing_number_invalid" error when ENABLE_STRIPE_ONBOARDING_TASK_LIST is true and on the your-psp route', async () => {
    process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'true'

    req.url = '/your-psp/:credentialId/bank-details'

    updateBankAccountMock = sinon.spy((stripeAccountId, body) => {
      return new Promise((resolve, reject) => {
        const error = new Error()
        error.code = 'routing_number_invalid'
        reject(error)
      })
    })
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    await controller(req, res, next)

    sinon.assert.calledWith(updateBankAccountMock, res.locals.stripeAccount.stripeAccountId, {
      bank_account_sort_code: sanitisedSortCode,
      bank_account_number: sanitisedAccountNumber
    })
    sinon.assert.notCalled(setStripeAccountSetupFlagMock)
    sinon.assert.notCalled(res.redirect)
    sinon.assert.called(res.render)

    const pageData = res.render.firstCall.args[1]
    expect(pageData.enableStripeOnboardingTaskList).equal(true)
    expect(pageData.currentCredential).to.deep.equal({ external_id: 'a-valid-credential-external-id' })
  })

  it('should re-render the form page when Stripe returns "account_number_invalid" error when ENABLE_STRIPE_ONBOARDING_TASK_LIST is true and on the your-psp route', async () => {
    process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'true'

    req.url = '/your-psp/:credentialId/bank-details'

    updateBankAccountMock = sinon.spy((stripeAccountId, body) => {
      return new Promise((resolve, reject) => {
        const error = new Error()
        error.code = 'account_number_invalid'
        reject(error)
      })
    })
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    await controller(req, res, next)

    sinon.assert.calledWith(updateBankAccountMock, res.locals.stripeAccount.stripeAccountId, {
      bank_account_sort_code: sanitisedSortCode,
      bank_account_number: sanitisedAccountNumber
    })
    sinon.assert.notCalled(setStripeAccountSetupFlagMock)
    sinon.assert.notCalled(res.redirect)
    sinon.assert.called(res.render)

    const pageData = res.render.firstCall.args[1]
    expect(pageData.enableStripeOnboardingTaskList).equal(true)
    expect(pageData.currentCredential).to.deep.equal({ external_id: 'a-valid-credential-external-id' })
  })

  it('should redirect to add psp account details route when ENABLE_STRIPE_ONBOARDING_TASK_LIST is set to false', async () => {
    process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'false'

    updateBankAccountMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    await controller(req, res, next)

    sinon.assert.calledWith(updateBankAccountMock)
    sinon.assert.calledWith(setStripeAccountSetupFlagMock)
    sinon.assert.calledWith(res.redirect, 303, '/account/a-valid-external-id/stripe/add-psp-account-details')
  })

  function getControllerWithMocks () {
    return proxyquire('./post.controller', {
      '../../../services/clients/stripe/stripe.client': {
        updateBankAccount: updateBankAccountMock
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
})
