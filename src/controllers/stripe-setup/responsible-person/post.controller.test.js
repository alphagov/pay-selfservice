'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const assert = require('assert')
const { expect } = require('chai')
const paths = require('../../../paths')
const gatewayAccountFixtures = require('../../../../test/fixtures/gateway-account.fixtures')
const userFixtures = require('../../../../test/fixtures/user.fixtures')
const User = require('../../../models/User.class')

describe('Responsible person POST controller', () => {
  const firstName = 'Chesney '
  const firstNameNormalised = 'Chesney'
  const lastName = ' Hawkes '
  const lastNameNormalised = 'Hawkes'
  const addressLine1 = ' 1 and Only'
  const addressLine1Normalised = '1 and Only'
  const addressLine2 = 'Call me by my name '
  const addressLine2Normalised = 'Call me by my name'
  const addressCity = ' Nobody I’d rather be '
  const addressCityNormalised = 'Nobody I’d rather be'
  const addressPostcode = 'im10ny '
  const addressPostcodeNormalised = 'IM1 0NY'
  const dobDay = '22 '
  const dobDayNormalised = 22
  const dobMonth = ' 09'
  const dobMonthNormalised = 9
  const dobYear = '1971 '
  const dobYearNormalised = 1971
  const telephone = '01134960000 '
  const telephoneNormalised = '+44 113 496 0000'
  const email = ' foo@example.com'
  const emailNormalised = 'foo@example.com'

  const postBody = {
    'first-name': firstName,
    'last-name': lastName,
    'home-address-line-1': addressLine1,
    'home-address-city': addressCity,
    'home-address-postcode': addressPostcode,
    'dob-day': dobDay,
    'dob-month': dobMonth,
    'dob-year': dobYear,
    'telephone-number': telephone,
    email,
    'answers-checked': 'true'
  }
  const postBodyWithAddress2 = {
    ...postBody,
    'home-address-line-2': addressLine2
  }

  const stripeAccountId = 'acct_123example123'
  const credentialId = 'a-credential-id'
  const accountExternalId = 'a-valid-external-id'
  const account = gatewayAccountFixtures.validGatewayAccountResponse({
    gateway_account_id: '1',
    external_id: accountExternalId,
    gateway_account_credentials: [{
      external_id: credentialId
    }]
  })
  const user = new User(userFixtures.validUserResponse())
  const service = user.serviceRoles[0].service

  const personId = 'person-1'
  const stripeListPersonsSingleResultResponse = {
    data: [
      {
        id: personId,
        relationship: {
          representative: true
        }
      }
    ]
  }

  let req
  let next
  let res
  let setStripeAccountSetupFlagMock
  let listPersonsMock
  let updatePersonMock
  let createPersonMock
  let updateCompanyMock

  function getControllerWithMocks () {
    return proxyquire('./post.controller', {
      '../../../services/clients/stripe/stripe.client': {
        listPersons: listPersonsMock,
        updatePerson: updatePersonMock,
        createPerson: createPersonMock,
        updateCompany: updateCompanyMock
      },
      '../../../services/clients/connector.client': {
        ConnectorClient: function () {
          this.setStripeAccountSetupFlag = setStripeAccountSetupFlagMock
        }
      },
      '../stripe-setup.util': {
        getStripeAccountId: () => {
          return Promise.resolve(stripeAccountId)
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
      body: {},
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
    updatePersonMock = sinon.spy(() => Promise.resolve())
    updateCompanyMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
  })

  it('should call Stripe with normalised details (with second address line), then connector, then redirect to add details redirect route', async function () {
    listPersonsMock = sinon.stub((stripeAccountId) => Promise.resolve({
      data: [
        {
          id: 'other-person',
          relationship: {
            representative: false
          }
        },
        {
          id: personId,
          relationship: {
            representative: true
          }
        }
      ]
    }))
    const controller = getControllerWithMocks()

    req.body = { ...postBodyWithAddress2 }

    await controller(req, res, next)

    sinon.assert.calledWith(updatePersonMock, res.locals.stripeAccount.stripeAccountId, personId, {
      first_name: firstNameNormalised,
      last_name: lastNameNormalised,
      address_line1: addressLine1Normalised,
      address_line2: addressLine2Normalised,
      address_city: addressCityNormalised,
      address_postcode: addressPostcodeNormalised,
      dob_day: dobDayNormalised,
      dob_month: dobMonthNormalised,
      dob_year: dobYearNormalised,
      phone: telephoneNormalised,
      email: emailNormalised
    })
    sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'responsible_person')
    sinon.assert.calledWith(updateCompanyMock, stripeAccountId, { executives_provided: true })
    sinon.assert.calledWith(res.redirect, 303, `/account/a-valid-external-id${paths.account.stripe.addPspAccountDetails}`)
  })

  it('should call Stripe with normalised details (no second address line), then connector, then redirect to add details redirect route', async function () {
    listPersonsMock = sinon.stub((stripeAccountId) => Promise.resolve(stripeListPersonsSingleResultResponse))
    const controller = getControllerWithMocks()

    req.body = { ...postBody }

    await controller(req, res, next)

    sinon.assert.calledWith(updatePersonMock, res.locals.stripeAccount.stripeAccountId, personId, {
      first_name: firstNameNormalised,
      last_name: lastNameNormalised,
      address_line1: addressLine1Normalised,
      address_city: addressCityNormalised,
      address_postcode: addressPostcodeNormalised,
      dob_day: dobDayNormalised,
      dob_month: dobMonthNormalised,
      dob_year: dobYearNormalised,
      phone: telephoneNormalised,
      email: emailNormalised
    })
    sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'responsible_person')
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

  it('should render error if bank details are already provided ', async () => {
    const controller = getControllerWithMocks()
    req.account.connectorGatewayAccountStripeProgress = { responsiblePerson: true }

    await controller(req, res, next)

    sinon.assert.calledWith(res.render, 'error-with-link')
  })

  it('should render error page when ENABLE_STRIPE_ONBOARDING_TASK_LIST is true and on the your-psp route', async () => {
    process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'true'

    const controller = getControllerWithMocks()
    req.account.connectorGatewayAccountStripeProgress = { responsiblePerson: false }

    req.url = '/your-psp/:credentialId/esponsible-person'
    req.body = {}

    await controller(req, res, next)

    sinon.assert.calledWith(res.render, 'stripe-setup/responsible-person/index')
    const pageData = res.render.firstCall.args[1]
    expect(pageData.enableStripeOnboardingTaskList).to.equal(true)
    expect(pageData.currentGatewayAccount.external_id).to.equal('a-valid-external-id')
  })

  it('should display an error for phone number when Stripe returns error, not call connector', async function () {
    const personId = 'person-1'
    listPersonsMock = sinon.stub((stripeAccountId) => Promise.resolve({
      data: [
        {
          id: personId,
          relationship: {
            representative: true
          }
        }
      ]
    }))
    const errorFromStripe = {
      type: 'StripeInvalidRequestError',
      param: 'phone'
    }
    updatePersonMock = sinon.spy(() => Promise.reject(errorFromStripe))
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    req.body = { ...postBody }

    await controller(req, res, next)

    sinon.assert.called(updatePersonMock)
    sinon.assert.notCalled(setStripeAccountSetupFlagMock)

    sinon.assert.calledWith(res.render, 'stripe-setup/responsible-person/index')
    assert.strictEqual(res.render.getCalls()[0].args[1].errors['telephone-number'],
      'Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192')
  })

  it('should display an error for phone number when Stripe returns error, not call connector and ENABLE_STRIPE_ONBOARDING_TASK_LIST is true and on the your-psp route', async function () {
    process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'true'

    const personId = 'person-1'
    listPersonsMock = sinon.stub((stripeAccountId) => Promise.resolve({
      data: [
        {
          id: personId,
          relationship: {
            representative: true
          }
        }
      ]
    }))
    const errorFromStripe = {
      type: 'StripeInvalidRequestError',
      param: 'phone'
    }
    updatePersonMock = sinon.spy(() => Promise.reject(errorFromStripe))
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    req.url = '/your-psp/:credentialId/esponsible-person'
    req.body = { ...postBody }

    await controller(req, res, next)

    sinon.assert.called(updatePersonMock)
    sinon.assert.notCalled(setStripeAccountSetupFlagMock)

    sinon.assert.calledWith(res.render, 'stripe-setup/responsible-person/index')
    assert.strictEqual(res.render.getCalls()[0].args[1].errors['telephone-number'],
      'Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192')

    const pageData = res.render.firstCall.args[1]
    expect(pageData.enableStripeOnboardingTaskList).to.equal(true)
    expect(pageData.currentGatewayAccount.external_id).to.equal('a-valid-external-id')
  })

  it('should display an error for date of birth when Stripe returns error, not call connector', async function () {
    const personId = 'person-1'
    listPersonsMock = sinon.stub((stripeAccountId) => Promise.resolve({
      data: [
        {
          id: personId,
          relationship: {
            representative: true
          }
        }
      ]
    }))
    const errorFromStripe = {
      type: 'StripeInvalidRequestError',
      param: 'dob[year]'
    }
    updatePersonMock = sinon.spy(() => Promise.reject(errorFromStripe))
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    req.body = { ...postBody }

    await controller(req, res, next)

    sinon.assert.called(updatePersonMock)
    sinon.assert.notCalled(setStripeAccountSetupFlagMock)

    sinon.assert.calledWith(res.render, 'stripe-setup/responsible-person/index')
    assert.strictEqual(res.render.getCalls()[0].args[1].errors['dob-day'],
      'Enter a valid date')
  })

  it('should display an error for date of birth when Stripe returns error, not call connector and ENABLE_STRIPE_ONBOARDING_TASK_LIST is true and on the your-psp route', async function () {
    process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'true'

    const personId = 'person-1'
    listPersonsMock = sinon.stub((stripeAccountId) => Promise.resolve({
      data: [
        {
          id: personId,
          relationship: {
            representative: true
          }
        }
      ]
    }))
    const errorFromStripe = {
      type: 'StripeInvalidRequestError',
      param: 'dob[year]'
    }
    updatePersonMock = sinon.spy(() => Promise.reject(errorFromStripe))
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    req.url = '/your-psp/:credentialId/esponsible-person'
    req.body = { ...postBody }

    await controller(req, res, next)

    sinon.assert.called(updatePersonMock)
    sinon.assert.notCalled(setStripeAccountSetupFlagMock)

    sinon.assert.calledWith(res.render, 'stripe-setup/responsible-person/index')
    assert.strictEqual(res.render.getCalls()[0].args[1].errors['dob-day'],
      'Enter a valid date')

    const pageData = res.render.firstCall.args[1]
    expect(pageData.enableStripeOnboardingTaskList).to.equal(true)
    expect(pageData.currentGatewayAccount.external_id).to.equal('a-valid-external-id')
  })

  it('should render error when Stripe returns error, not call connector, and not redirect', async function () {
    const personId = 'person-1'
    listPersonsMock = sinon.stub((stripeAccountId) => Promise.resolve({
      data: [
        {
          id: personId,
          relationship: {
            representative: true
          }
        }
      ]
    }))
    updatePersonMock = sinon.spy(() => Promise.reject(new Error()))
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    req.body = { ...postBody }

    await controller(req, res, next)

    sinon.assert.called(updatePersonMock)
    sinon.assert.notCalled(setStripeAccountSetupFlagMock)
    sinon.assert.notCalled(res.redirect)
    const expectedError = sinon.match.instanceOf(Error)
    sinon.assert.calledWith(next, expectedError)
  })

  it('should render error when connector returns error', async function () {
    const personId = 'person-1'
    listPersonsMock = sinon.stub((stripeAccountId) => Promise.resolve({
      data: [
        {
          id: personId,
          relationship: {
            representative: true
          }
        }
      ]
    }))
    updatePersonMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.reject(new Error()))
    const controller = getControllerWithMocks()

    req.body = { ...postBody }

    await controller(req, res, next)

    sinon.assert.called(updatePersonMock)
    sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'responsible_person')
    sinon.assert.notCalled(res.redirect)
    const expectedError = sinon.match.instanceOf(Error)
    sinon.assert.calledWith(next, expectedError)
  })

  it('should call Stripe to create new user, then connector, then redirect to add details redirect route', async function () {
    const personId = 'person-1'
    listPersonsMock = sinon.stub((stripeAccountId) => Promise.resolve({
      data: [
        {
          id: personId,
          relationship: {
            representative: false
          }
        }
      ]
    }))
    createPersonMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    req.body = { ...postBodyWithAddress2 }

    await controller(req, res, next)

    sinon.assert.calledWith(createPersonMock, res.locals.stripeAccount.stripeAccountId, {
      first_name: firstNameNormalised,
      last_name: lastNameNormalised,
      address_line1: addressLine1Normalised,
      address_city: addressCityNormalised,
      address_postcode: addressPostcodeNormalised,
      dob_day: dobDayNormalised,
      dob_month: dobMonthNormalised,
      dob_year: dobYearNormalised,
      phone: telephoneNormalised,
      email: emailNormalised,
      address_line2: addressLine2Normalised
    })
    sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'responsible_person')
    sinon.assert.calledWith(updateCompanyMock, stripeAccountId, { executives_provided: true })
    sinon.assert.calledWith(res.redirect, 303, `/account/a-valid-external-id${paths.account.stripe.addPspAccountDetails}`)
  })
  it('should redirect to the task list page when ENABLE_STRIPE_ONBOARDING_TASK_LIST is set to true ', async function () {
    process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'true'

    const personId = 'person-1'
    listPersonsMock = sinon.stub((stripeAccountId) => Promise.resolve({
      data: [
        {
          id: personId,
          relationship: {
            representative: true
          }
        }
      ]
    }))

    updateCompanyMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    req.url = '/your-psp/:credentialId/esponsible-person'
    req.body = postBody
    req.params = {
      credentialId: 'a-valid-credential-external-id'
    }

    await controller(req, res, next)

    sinon.assert.calledWith(updateCompanyMock)
    sinon.assert.calledWith(setStripeAccountSetupFlagMock)
    sinon.assert.calledWith(res.redirect, 303, '/account/a-valid-external-id/your-psp/a-valid-credential-external-id')
  })

  it('should redirect to add psp account details route when ENABLE_STRIPE_ONBOARDING_TASK_LIST is set to false ', async function () {
    process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'false'

    const personId = 'person-1'
    listPersonsMock = sinon.stub((stripeAccountId) => Promise.resolve({
      data: [
        {
          id: personId,
          relationship: {
            representative: true
          }
        }
      ]
    }))

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
