'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const assert = require('assert')
const { expect } = require('chai')
const paths = require('@root/paths')
const gatewayAccountFixtures = require('@test/fixtures/gateway-account.fixtures')
const userFixtures = require('@test/fixtures/user.fixtures')
const User = require('@models/User.class')

describe('Director POST controller', () => {
  const firstName = 'Chesney '
  const firstNameNormalised = 'Chesney'
  const lastName = ' Hawkes '
  const lastNameNormalised = 'Hawkes'
  const dobDay = '22 '
  const dobDayNormalised = 22
  const dobMonth = ' 09'
  const dobMonthNormalised = 9
  const dobYear = '1971 '
  const dobYearNormalised = 1971
  const emailNormalised = 'test@example.org'
  const email = '   test@example.org     '

  const postBody = {
    'first-name': firstName,
    'last-name': lastName,
    email,
    'dob-day': dobDay,
    'dob-month': dobMonth,
    'dob-year': dobYear
  }

  const stripeAccountId = 'acct_123example123'
  const credentialId = 'a-credential-external-id'
  const accountExternalId = 'a-valid-external-id'
  const account = gatewayAccountFixtures.validGatewayAccountResponse({
    external_id: accountExternalId,
    gateway_account_credentials: [{
      external_id: credentialId
    }]
  })
  const user = new User(userFixtures.validUserResponse())
  const service = user.serviceRoles[0].service

  let req
  let next
  let res
  let listPersonsMock
  let setStripeAccountSetupFlagMock
  let createDirectorMock
  let updateDirectorMock
  let updateCompanyMock

  function getControllerWithMocks () {
    return proxyquire('./post.controller', {
      '@services/clients/stripe/stripe.client': {
        listPersons: listPersonsMock,
        updateDirector: updateDirectorMock,
        createDirector: createDirectorMock,
        updateCompany: updateCompanyMock
      },
      '@services/clients/connector.client': {
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
        ...account,
        connectorGatewayAccountStripeProgress: {}
      },
      user,
      service,
      flash: sinon.spy()
    }
    res = {
      setHeader: sinon.stub(),
      status: sinon.spy(),
      redirect: sinon.spy(),
      render: sinon.spy(),
      locals: {
        stripeAccount: {
          stripeAccountId
        }
      }
    }
    next = sinon.spy()
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    createDirectorMock = sinon.spy(() => Promise.resolve())
    updateDirectorMock = sinon.spy(() => Promise.resolve())
    updateCompanyMock = sinon.spy(() => Promise.resolve())
    listPersonsMock = sinon.spy(() => Promise.resolve())
  })

  it('should call Stripe with director details, update Stripe company, update connector and then redirect to add PSP account details', async () => {
    req.account.connectorGatewayAccountStripeProgress = { director: false }
    req.body = postBody
    const controller = getControllerWithMocks(true)

    await controller(req, res, next)

    sinon.assert.calledWith(createDirectorMock, res.locals.stripeAccount.stripeAccountId, {
      first_name: firstNameNormalised,
      last_name: lastNameNormalised,
      email: emailNormalised,
      dob_day: dobDayNormalised,
      dob_month: dobMonthNormalised,
      dob_year: dobYearNormalised
    })

    sinon.assert.calledWith(updateCompanyMock, res.locals.stripeAccount.stripeAccountId, { directors_provided: true })
    sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'director')
    sinon.assert.calledWith(res.redirect, 303, `/account/${accountExternalId}${paths.account.stripe.addPspAccountDetails}`)
    sinon.assert.notCalled(req.flash)
  })

  it('should update director if already exists on Stripe', async () => {
    req.account.connectorGatewayAccountStripeProgress = { director: false }
    listPersonsMock = sinon.stub((stripeAccountId) => Promise.resolve({
      data: [
        {
          id: 'director-123',
          relationship: {
            director: true
          }
        }
      ]
    }))
    req.body = postBody
    const controller = getControllerWithMocks()

    await controller(req, res, next)

    sinon.assert.calledWith(updateDirectorMock, res.locals.stripeAccount.stripeAccountId, 'director-123', {
      first_name: firstNameNormalised,
      last_name: lastNameNormalised,
      email: emailNormalised,
      dob_day: dobDayNormalised,
      dob_month: dobMonthNormalised,
      dob_year: dobYearNormalised
    })
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

  it('should render error if director details are already provided ', async () => {
    const controller = getControllerWithMocks()
    req.account.connectorGatewayAccountStripeProgress = { director: true }

    await controller(req, res, next)

    sinon.assert.calledWith(res.render, 'error-with-link')
  })

  it('should display an error message, when Stripe returns error for date of birth, not call connector', async function () {
    const errorFromStripe = {
      type: 'StripeInvalidRequestError',
      param: 'dob[year]'
    }
    createDirectorMock = sinon.spy(() => Promise.reject(errorFromStripe))
    req.body = { ...postBody }

    const controller = getControllerWithMocks()
    await controller(req, res, next)

    sinon.assert.called(createDirectorMock)
    sinon.assert.notCalled(setStripeAccountSetupFlagMock)

    sinon.assert.calledWith(res.render, 'stripe-setup/director/index')
    assert.strictEqual(res.render.getCalls()[0].args[1].errors['dob-day'], 'Enter a valid date')
  })

  it('should render error page when Stripe returns error, not call connector, and not redirect', async function () {
    createDirectorMock = sinon.spy(() => Promise.reject(new Error()))
    const controller = getControllerWithMocks()

    req.body = { ...postBody }

    await controller(req, res, next)

    sinon.assert.called(createDirectorMock)
    sinon.assert.notCalled(setStripeAccountSetupFlagMock)
    sinon.assert.notCalled(res.redirect)
    const expectedError = sinon.match.instanceOf(Error)
    sinon.assert.calledWith(next, expectedError)
  })

  it('should render error when connector returns error', async function () {
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.reject(new Error()))
    const controller = getControllerWithMocks()

    req.body = { ...postBody }

    await controller(req, res, next)

    sinon.assert.called(createDirectorMock)
    sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'director')
    sinon.assert.notCalled(res.redirect)
    const expectedError = sinon.match.instanceOf(Error)
    sinon.assert.calledWith(next, expectedError)
  })

  it('should redirect to the task list page when ENABLE_STRIPE_ONBOARDING_TASK_LIST is set to true ', async function () {
    process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'true'

    req.url = '/your-psp/:credentialId/director'

    updateCompanyMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    req.body = postBody
    req.params = {
      credentialId: 'a-valid-credential-external-id'
    }

    await controller(req, res, next)

    sinon.assert.calledWith(updateCompanyMock)
    sinon.assert.calledWith(setStripeAccountSetupFlagMock)
    sinon.assert.calledWith(res.redirect, 303, '/account/a-valid-external-id/your-psp/a-valid-credential-external-id')
  })

  it('should render error page with side navigation when ENABLE_STRIPE_ONBOARDING_TASK_LIST is true and on the your-psp route', async function () {
    process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'true'

    req.url = '/your-psp/:credentialId/director'

    const controller = getControllerWithMocks()

    req.body = {}

    await controller(req, res, next)

    sinon.assert.calledWith(res.render, 'stripe-setup/director/index')
    const pageData = res.render.firstCall.args[1]
    expect(pageData.enableStripeOnboardingTaskList).to.equal(true)
    expect(pageData.currentCredential.external_id).to.equal('a-credential-external-id')
  })

  it('should display an error message, when Stripe returns error for date of birth, not call connector when ENABLE_STRIPE_ONBOARDING_TASK_LIST is true and on the your-psp route', async function () {
    process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'true'

    req.url = '/your-psp/:credentialId/director'

    const errorFromStripe = {
      type: 'StripeInvalidRequestError',
      param: 'dob[year]'
    }
    createDirectorMock = sinon.spy(() => Promise.reject(errorFromStripe))
    req.body = { ...postBody }

    const controller = getControllerWithMocks()
    await controller(req, res, next)

    sinon.assert.called(createDirectorMock)
    sinon.assert.notCalled(setStripeAccountSetupFlagMock)

    sinon.assert.calledWith(res.render, 'stripe-setup/director/index')

    const pageData = res.render.firstCall.args[1]
    assert.strictEqual(pageData.errors['dob-day'], 'Enter a valid date')
    expect(pageData.enableStripeOnboardingTaskList).to.equal(true)
    expect(pageData.currentCredential.external_id).to.equal('a-credential-external-id')
  })

  it('should redirect to add psp account details route when ENABLE_STRIPE_ONBOARDING_TASK_LIST is set to false ', async function () {
    process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'false'

    updateCompanyMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    req.body = postBody

    await controller(req, res, next)

    sinon.assert.calledWith(updateCompanyMock)
    sinon.assert.calledWith(setStripeAccountSetupFlagMock)
    sinon.assert.calledWith(res.redirect, 303, '/account/a-valid-external-id/stripe/add-psp-account-details')
  })
})
