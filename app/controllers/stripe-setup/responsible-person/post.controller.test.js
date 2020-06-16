'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const proxyquire = require('proxyquire')
const sinon = require('sinon')

const paths = require('../../../paths')

chai.use(chaiAsPromised)
const { expect } = chai // must be called after chai.use(chaiAsPromised) to use "should.eventually"

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

  let req
  let res
  let setStripeAccountSetupFlagMock
  let listPersonsMock
  let updatePersonMock

  function getControllerWithMocks () {
    return proxyquire('./post.controller', {
      '../../../services/clients/stripe/stripe_client': {
        listPersons: listPersonsMock,
        updatePerson: updatePersonMock
      },
      '../../../services/clients/connector_client': {
        ConnectorClient: function () {
          this.setStripeAccountSetupFlag = setStripeAccountSetupFlagMock
        }
      }
    })
  }

  beforeEach(() => {
    req = {
      correlationId: 'correlation-id',
      account: {
        gateway_account_id: '1'
      }
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
  })

  it('should call Stripe with normalised details (with second address line), then connector, then redirect to the dashboard', async function () {
    const personId = 'person-1'
    listPersonsMock = sinon.stub((stripeAccountId) => {
      return new Promise(resolve => {
        resolve({
          data: [
            { id: 'other-person' },
            { id: personId }
          ]
        })
      })
    })
    updatePersonMock = sinon.spy((stripeAccountId, personId, body) => {
      return new Promise(resolve => {
        resolve()
      })
    })
    setStripeAccountSetupFlagMock = sinon.spy((gatewayAccountId, stripeAccountSetupFlag, correlationId) => {
      return new Promise(resolve => {
        resolve()
      })
    })
    const controller = getControllerWithMocks()

    req.body = {
      'first-name': firstName,
      'last-name': lastName,
      'home-address-line-1': addressLine1,
      'home-address-line-2': addressLine2,
      'home-address-city': addressCity,
      'home-address-postcode': addressPostcode,
      'dob-day': dobDay,
      'dob-month': dobMonth,
      'dob-year': dobYear,
      'answers-checked': 'true'
    }

    await controller(req, res)

    expect(updatePersonMock.calledWith(res.locals.stripeAccount.stripeAccountId, personId, { // eslint-disable-line
      first_name: firstNameNormalised,
      last_name: lastNameNormalised,
      address_line1: addressLine1Normalised,
      address_line2: addressLine2Normalised,
      address_city: addressCityNormalised,
      address_postcode: addressPostcodeNormalised,
      dob_day: dobDayNormalised,
      dob_month: dobMonthNormalised,
      dob_year: dobYearNormalised
    })).to.be.true
    expect(setStripeAccountSetupFlagMock.calledWith(req.account.gateway_account_id, 'responsible_person', req.correlationId)).to.be.true // eslint-disable-line
    expect(res.redirect.calledWith(303, paths.dashboard.index)).to.be.true // eslint-disable-line
  })

  it('should call Stripe with normalised details (no second address line), then connector, then redirect to the dashboard', async function () {
    const personId = 'person-1'
    listPersonsMock = sinon.stub((stripeAccountId) => {
      return new Promise(resolve => {
        resolve({
          data: [
            { id: personId }
          ]
        })
      })
    })
    updatePersonMock = sinon.spy((stripeAccountId, personId, body) => {
      return new Promise(resolve => {
        resolve()
      })
    })
    setStripeAccountSetupFlagMock = sinon.spy((gatewayAccountId, stripeAccountSetupFlag, correlationId) => {
      return new Promise(resolve => {
        resolve()
      })
    })
    const controller = getControllerWithMocks()

    req.body = {
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

    await controller(req, res)

    expect(updatePersonMock.calledWith(res.locals.stripeAccount.stripeAccountId, personId, { // eslint-disable-line
      first_name: firstNameNormalised,
      last_name: lastNameNormalised,
      address_line1: addressLine1Normalised,
      address_city: addressCityNormalised,
      address_postcode: addressPostcodeNormalised,
      dob_day: dobDayNormalised,
      dob_month: dobMonthNormalised,
      dob_year: dobYearNormalised
    })).to.be.true
    expect(setStripeAccountSetupFlagMock.calledWith(req.account.gateway_account_id, 'responsible_person', req.correlationId)).to.be.true // eslint-disable-line
    expect(res.redirect.calledWith(303, paths.dashboard.index)).to.be.true // eslint-disable-line
  })

  it('should render error when Stripe returns error, not call connector, and not redirect', async function () {
    const personId = 'person-1'
    listPersonsMock = sinon.stub((stripeAccountId) => {
      return new Promise(resolve => {
        resolve({
          data: [
            { id: personId }
          ]
        })
      })
    })
    updatePersonMock = sinon.spy((stripeAccountId, personId, body) => {
      return new Promise((resolve, reject) => {
        reject(new Error())
      })
    })
    setStripeAccountSetupFlagMock = sinon.spy((gatewayAccountId, stripeAccountSetupFlag, correlationId) => {
      return new Promise(resolve => {
        resolve()
      })
    })
    const controller = getControllerWithMocks()

    req.body = {
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

    await controller(req, res)

    expect(updatePersonMock.calledWith(res.locals.stripeAccount.stripeAccountId, personId, { // eslint-disable-line
      first_name: firstNameNormalised,
      last_name: lastNameNormalised,
      address_line1: addressLine1Normalised,
      address_city: addressCityNormalised,
      address_postcode: addressPostcodeNormalised,
      dob_day: dobDayNormalised,
      dob_month: dobMonthNormalised,
      dob_year: dobYearNormalised
    })).to.be.true
    expect(setStripeAccountSetupFlagMock.notCalled).to.be.true // eslint-disable-line
    expect(res.redirect.notCalled).to.be.true // eslint-disable-line
    expect(res.status.calledWith(500)).to.be.true // eslint-disable-line
    expect(res.render.calledWith('error', { message: 'Please try again or contact support team' })).to.be.true // eslint-disable-line
  })

  it('should render error when connector returns error', async function () {
    const personId = 'person-1'
    listPersonsMock = sinon.stub((stripeAccountId) => {
      return new Promise(resolve => {
        resolve({
          data: [
            { id: personId }
          ]
        })
      })
    })
    updatePersonMock = sinon.spy((stripeAccountId, personId, body) => {
      return new Promise(resolve => {
        resolve()
      })
    })
    setStripeAccountSetupFlagMock = sinon.spy((gatewayAccountId, stripeAccountSetupFlag, correlationId) => {
      return new Promise((resolve, reject) => {
        reject(new Error())
      })
    })
    const controller = getControllerWithMocks()

    req.body = {
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

    await controller(req, res)

    expect(updatePersonMock.calledWith(res.locals.stripeAccount.stripeAccountId, personId, { // eslint-disable-line
      first_name: firstNameNormalised,
      last_name: lastNameNormalised,
      address_line1: addressLine1Normalised,
      address_city: addressCityNormalised,
      address_postcode: addressPostcodeNormalised,
      dob_day: dobDayNormalised,
      dob_month: dobMonthNormalised,
      dob_year: dobYearNormalised
    })).to.be.true
    expect(setStripeAccountSetupFlagMock.calledWith(req.account.gateway_account_id, 'responsible_person', req.correlationId)).to.be.true // eslint-disable-line
    expect(res.redirect.notCalled).to.be.true // eslint-disable-line
    expect(res.status.calledWith(500)).to.be.true // eslint-disable-line
    expect(res.render.calledWith('error', { message: 'Please try again or contact support team' })).to.be.true // eslint-disable-line
  })
})
