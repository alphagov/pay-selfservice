'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const paths = require('../../../paths')

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
    'answers-checked': 'true'
  }
  const postBodyWithAddress2 = {
    ...postBody,
    'home-address-line-2': addressLine2
  }

  let req
  let next
  let res
  let setStripeAccountSetupFlagMock
  let listPersonsMock
  let updatePersonMock
  let createPersonMock

  function getControllerWithMocks () {
    return proxyquire('./post.controller', {
      '../../../services/clients/stripe/stripe.client': {
        listPersons: listPersonsMock,
        updatePerson: updatePersonMock,
        createPerson: createPersonMock
      },
      '../../../services/clients/connector.client': {
        ConnectorClient: function () {
          this.setStripeAccountSetupFlag = setStripeAccountSetupFlagMock
          this.getStripeAccount = () => Promise.resolve({
            stripeAccountId: 'acct_123example123'
          })
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
  })

  it('should call Stripe with normalised details (with second address line), then connector, then redirect to add details redirect route', async function () {
    const personId = 'person-1'
    listPersonsMock = sinon.stub((stripeAccountId) => Promise.resolve({
      data: [
        { id: 'other-person',
          relationship: {
            representative: false
          }
        },
        { id: personId,
          relationship: {
            representative: true
          }
        }
      ]
    }))
    updatePersonMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
    const controller = getControllerWithMocks()

    req.body = { ...postBodyWithAddress2 }

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
      address_line2: addressLine2Normalised
    })
    sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'responsible_person', req.correlationId)
    sinon.assert.calledWith(res.redirect, 303, `/account/a-valid-external-id${paths.account.stripe.addPspAccountDetails}`)
  })

  it('should call Stripe with normalised details (no second address line), then connector, then redirect to add details redirect route', async function () {
    const personId = 'person-1'
    listPersonsMock = sinon.stub((stripeAccountId) => Promise.resolve({
      data: [
        { id: personId,
          relationship: {
            representative: true
          }
        }
      ]
    }))
    updatePersonMock = sinon.spy(() => Promise.resolve())
    setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
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
      dob_year: dobYearNormalised
    })
    sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'responsible_person', req.correlationId)
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

  it('should redirect to dashboard if bank details are already provided ', async () => {
    const controller = getControllerWithMocks()
    req.account.connectorGatewayAccountStripeProgress = { responsiblePerson: true }

    await controller(req, res, next)

    sinon.assert.calledWith(req.flash, 'genericError', 'You’ve already nominated your responsible person. Contact GOV.UK Pay support if you need to change them.')
    sinon.assert.calledWith(res.redirect, 303, `/account/a-valid-external-id/dashboard`)
  })

  it('should render error when Stripe returns error, not call connector, and not redirect', async function () {
    const personId = 'person-1'
    listPersonsMock = sinon.stub((stripeAccountId) => Promise.resolve({
      data: [
        { id: personId,
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
        { id: personId,
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
    sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'responsible_person', req.correlationId)
    sinon.assert.notCalled(res.redirect)
    const expectedError = sinon.match.instanceOf(Error)
    sinon.assert.calledWith(next, expectedError)
  })

  it('should call Stripe to create new user, then connector, then redirect to add details redirect route', async function () {
    const personId = 'person-1'
    listPersonsMock = sinon.stub((stripeAccountId) => Promise.resolve({
      data: [
        { id: personId,
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
      address_line2: addressLine2Normalised,
      address_city: addressCityNormalised,
      address_postcode: addressPostcodeNormalised,
      dob_day: dobDayNormalised,
      dob_month: dobMonthNormalised,
      dob_year: dobYearNormalised
    })
    sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'responsible_person', req.correlationId)
    sinon.assert.calledWith(res.redirect, 303, `/account/a-valid-external-id${paths.account.stripe.addPspAccountDetails}`)
  })

  describe('COLLECT_ADDITIONAL_KYC_DATA environment variable enabled', () => {
    before(() => {
      process.env.COLLECT_ADDITIONAL_KYC_DATA = true
    })

    after(() => {
      process.env.COLLECT_ADDITIONAL_KYC_DATA = false
    })

    it('should send telephone number and email to Stripe', async function () {
      const personId = 'person-1'
      listPersonsMock = sinon.stub((stripeAccountId) => Promise.resolve({
        data: [
          { id: personId,
            relationship: {
              representative: true
            }
          }
        ]
      }))
      updatePersonMock = sinon.spy(() => Promise.resolve())
      setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
      const controller = getControllerWithMocks()

      req.body = {
        ...postBody,
        email,
        'telephone-number': telephone
      }

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
      sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'responsible_person', req.correlationId)
      sinon.assert.calledWith(res.redirect, 303, `/account/a-valid-external-id${paths.account.stripe.addPspAccountDetails}`)
    })
  })
})
