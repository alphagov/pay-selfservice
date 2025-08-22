'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { expect } = require('chai')

const goLiveStage = require('@models/constants/go-live-stage')
const Service = require('@models/service/Service.class')
const serviceFixtures = require('../../../../test/fixtures/service.fixtures')
const gatewayAccountFixture = require('../../../../test/fixtures/gateway-account.fixtures')

const mockResponse = sinon.stub()

const loggerInfoMock = sinon.spy()
const stripeAccountId = 'acct_123example123'
const setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
const updateStripeAccountMock = sinon.spy(() => Promise.resolve())

const stubGetStripeAccountId = sinon.stub().resolves(stripeAccountId)

const getController = function getController (mockServiceService) {
  return proxyquire('./post.controller', {
    '@services/service.service': mockServiceService,
    '@services/clients/connector.client': {
      ConnectorClient: function () {
        this.setStripeAccountSetupFlag = setStripeAccountSetupFlagMock
      }
    },
    '@utils/response': {
      response: mockResponse
    },
    '@controllers/stripe-setup/stripe-setup.util': {
      getStripeAccountId: (...params) => {
        return stubGetStripeAccountId(...params)
      }
    },
    '@utils/logger': function (filename) {
      return {
        info: loggerInfoMock
      }
    },
    '@services/clients/stripe/stripe.client': {
      updateOrganisationDetails: updateStripeAccountMock
    }
  })
}

const errorKeysAndMessage = {
  errorName: {
    key: 'merchant-name',
    text: 'Enter a name'
  },
  errorAddressLine1: {
    key: 'address-line1',
    text: 'Enter a building and street'
  },
  errorAddressCity: {
    key: 'address-city',
    text: 'Enter a town or city'
  },
  errorAddressPostcode: {
    key: 'address-postcode',
    text: 'Enter a postcode'
  },
  errorTelephoneNumber: {
    key: 'telephone-number',
    text: 'Enter a telephone number'
  },
  errorWebsiteAddress: {
    key: 'url',
    text: 'Enter a website address'
  }
}

const serviceExternalId = 'abc123'
const validLine1 = 'A building'
const validLine2 = 'A street'
const validCity = 'A city'
const validCountry = 'GB'
const validPostcode = 'E1 8QS'
const validTelephoneNumber = '01134960000'
const validUrl = 'https://www.example.com'

describe('organisation address - post controller', () => {
  let req, res, next, controller
  let responseData

  const mockUpdateService = sinon.spy(() => {
    return new Promise(resolve => {
      resolve(updatedService)
    })
  })

  const updatedService = new Service(serviceFixtures.validServiceResponse({
    external_id: serviceExternalId,
    current_go_live_stage: goLiveStage.ENTERED_ORGANISATION_ADDRESS
  }))

  beforeEach(() => {
    res = {
      setHeader: sinon.stub(),
      status: sinon.spy(),
      redirect: sinon.spy(),
      render: sinon.spy()
    }

    req = { route: { path: '/request-to-go-live/organisation-address' } }

    next = sinon.spy()
    mockResponse.resetHistory()
    controller = getController(mockUpdateService)
  })

  describe('Form validation', () => {
      beforeEach(() => {
        req.route.path = '/request-to-go-live/organisation-address'
        controller(req, res, next)
        responseData = mockResponse.getCalls()[0]
      })

      it('should return errors when the required fields are missing', () => {
        expect(responseData.args[2]).to.equal('request-to-go-live/organisation-address')

        const errors = responseData.args[3].errors
        expect(Object.keys(errors).length).to.equal(5)
        expect(errors[errorKeysAndMessage.errorAddressLine1.key]).to.equal(errorKeysAndMessage.errorAddressLine1.text)
        expect(errors[errorKeysAndMessage.errorAddressCity.key]).to.equal(errorKeysAndMessage.errorAddressCity.text)
        expect(errors[errorKeysAndMessage.errorAddressPostcode.key]).to.equal(errorKeysAndMessage.errorAddressPostcode.text)
        expect(errors[errorKeysAndMessage.errorTelephoneNumber.key]).to.equal(errorKeysAndMessage.errorTelephoneNumber.text)
        expect(errors[errorKeysAndMessage.errorWebsiteAddress.key]).to.equal(errorKeysAndMessage.errorWebsiteAddress.text)
      })
  })

  describe('Form submissions', () => {
    describe('successful submission', () => {
      const service = new Service(serviceFixtures.validServiceResponse({
        external_id: serviceExternalId,
        current_go_live_stage: goLiveStage.ENTERED_ORGANISATION_NAME
      }))

      const req = {
        route: {
          path: '/request-to-go-live/organisation-address'
        },
        service,
        body: {
          'address-line1': validLine1,
          'address-line2': validLine2,
          'address-city': validCity,
          'address-postcode': validPostcode,
          'address-country': validCountry,
          'telephone-number': validTelephoneNumber,
          url: validUrl
        }
      }

      beforeEach(() => {
        res = {
          setHeader: sinon.stub(),
          status: sinon.spy(),
          redirect: sinon.spy(),
          render: sinon.spy()
        }
        next = sinon.spy()
        mockResponse.renderErrorView = sinon.spy()
      })

      describe('service update success', () => {
        const updatedService = new Service(serviceFixtures.validServiceResponse({
          external_id: serviceExternalId,
          current_go_live_stage: goLiveStage.ENTERED_ORGANISATION_ADDRESS
        }))

        const mockUpdateService = sinon.spy(() => {
          return new Promise(resolve => {
            resolve(updatedService)
          })
        })

        const mockServiceService = { updateService: mockUpdateService }
        const controller = getController(mockServiceService)

        it('should update merchant details and go live stage', async function () {
          const expectedUpdateServiceRequest = [
            {
              op: 'replace',
              path: 'merchant_details/address_line1',
              value: validLine1
            },
            {
              op: 'replace',
              path: 'merchant_details/address_line2',
              value: validLine2
            },
            {
              op: 'replace',
              path: 'merchant_details/address_city',
              value: validCity
            },
            {
              op: 'replace',
              path: 'merchant_details/address_postcode',
              value: validPostcode
            },
            {
              op: 'replace',
              path: 'merchant_details/address_country',
              value: validCountry
            },
            {
              op: 'replace',
              path: 'merchant_details/telephone_number',
              value: validTelephoneNumber
            },
            {
              op: 'replace',
              path: 'merchant_details/url',
              value: validUrl
            },
            {
              op: 'replace',
              path: 'current_go_live_stage',
              value: goLiveStage.ENTERED_ORGANISATION_ADDRESS
            }
          ]

          await controller(req, res, next)

          sinon.assert.calledWith(mockServiceService.updateService, serviceExternalId, expectedUpdateServiceRequest)
          sinon.assert.calledWith(res.redirect, 303, `/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`)
        })

        it('should submit empty strings for optional fields left blank', async function () {
          req.body = {
            'address-line1': validLine1,
            'address-line2': '',
            'address-city': validCity,
            'address-postcode': validPostcode,
            'address-country': validCountry,
            'telephone-number': validTelephoneNumber,
            url: validUrl
          }

          const expectedUpdateServiceRequest = [
            {
              op: 'replace',
              value: validLine1,
              path: 'merchant_details/address_line1'
            },
            {
              op: 'replace',
              value: '',
              path: 'merchant_details/address_line2'
            },
            {
              op: 'replace',
              value: validCity,
              path: 'merchant_details/address_city'
            },
            {
              op: 'replace',
              value: validPostcode,
              path: 'merchant_details/address_postcode'
            },
            {
              op: 'replace',
              value: validCountry,
              path: 'merchant_details/address_country'
            },
            {
              op: 'replace',
              value: validTelephoneNumber,
              path: 'merchant_details/telephone_number'
            },
            {
              op: 'replace',
              value: validUrl,
              path: 'merchant_details/url'
            },
            {
              op: 'replace',
              value: goLiveStage.ENTERED_ORGANISATION_ADDRESS,
              path: 'current_go_live_stage'
            }
          ]

          await controller(req, res, next)

          sinon.assert.calledWith(mockServiceService.updateService, serviceExternalId, expectedUpdateServiceRequest)
          sinon.assert.calledWith(res.redirect, 303, `/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`)
        })
      })

      describe('error updating service', () => {
        it('should call next with error', async function () {
          const err = new Error('an error')
          const mockUpdateService = () => Promise.reject(err)
          const mockServiceService = { updateService: mockUpdateService }
          const controller = getController(mockServiceService)

          await controller(req, res, next)
          sinon.assert.calledWith(next, err)
        })
      })
    })
    })
})
