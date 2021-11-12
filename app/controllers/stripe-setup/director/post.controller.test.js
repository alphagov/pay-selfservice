'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const paths = require('../../../paths')

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
    'email': email,
    'dob-day': dobDay,
    'dob-month': dobMonth,
    'dob-year': dobYear
  }

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
      '../../../services/clients/stripe/stripe.client': {
        listPersons: listPersonsMock,
        updateDirector: updateDirectorMock,
        createDirector: createDirectorMock,
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
      render: sinon.spy(),
      locals: {
        stripeAccount: {
          stripeAccountId: 'acct_123example123'
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
    const controller = getControllerWithMocks()

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
    sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'director', req.correlationId)
    sinon.assert.calledWith(res.redirect, 303, `/account/a-valid-external-id${paths.account.stripe.addPspAccountDetails}`)
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

  it('should render error when Stripe returns error, not call connector, and not redirect', async function () {
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
    sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'director', req.correlationId)
    sinon.assert.notCalled(res.redirect)
    const expectedError = sinon.match.instanceOf(Error)
    sinon.assert.calledWith(next, expectedError)
  })
})
