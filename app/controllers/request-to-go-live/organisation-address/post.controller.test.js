'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')

const goLiveStage = require('../../../models/go-live-stage')
const Service = require('../../../models/Service.class')
const serviceFixtures = require('../../../../test/fixtures/service.fixtures')
const mockResponse = {}
const getController = function getController (mockServiceService) {
  return proxyquire('./post.controller', {
    '../../../services/service.service': mockServiceService,
    '../../../utils/response': mockResponse
  })
}

describe('request to go live organisation address post controller', () => {
  describe('successful submission', () => {
    const correlationId = 'correlation-id'
    const serviceExternalId = 'abc123'
    const validLine1 = 'A building'
    const validLine2 = 'A street'
    const validCity = 'A city'
    const validCountry = 'GB'
    const validPostcode = 'E1 8QS'
    const validTeleponeNumber = '01134960000'
    const validUrl = 'https://www.example.com'

    const service = new Service(serviceFixtures.validServiceResponse({
      external_id: serviceExternalId,
      current_go_live_stage: goLiveStage.ENTERED_ORGANISATION_NAME
    }))

    const req = {
      correlationId,
      service: service,
      body: {
        'address-line1': validLine1,
        'address-line2': validLine2,
        'address-city': validCity,
        'address-postcode': validPostcode,
        'address-country': validCountry,
        'telephone-number': validTeleponeNumber
      }
    }

    let res, next
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
            'op': 'replace',
            'path': 'merchant_details/address_line1',
            'value': validLine1
          },
          {
            'op': 'replace',
            'path': 'merchant_details/address_line2',
            'value': validLine2
          },
          {
            'op': 'replace',
            'path': 'merchant_details/address_city',
            'value': validCity
          },
          {
            'op': 'replace',
            'path': 'merchant_details/address_postcode',
            'value': validPostcode
          },
          {
            'op': 'replace',
            'path': 'merchant_details/address_country',
            'value': validCountry
          },
          {
            'op': 'replace',
            'path': 'merchant_details/telephone_number',
            'value': validTeleponeNumber
          },
          {
            'op': 'replace',
            'path': 'current_go_live_stage',
            'value': goLiveStage.ENTERED_ORGANISATION_ADDRESS
          }
        ]

        await controller(req, res, next)

        sinon.assert.calledWith(mockServiceService.updateService, serviceExternalId, expectedUpdateServiceRequest, correlationId)
        sinon.assert.calledWith(res.redirect, 303, `/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`)
      })

      it('should submit empty strings for optional fields left blank', async function () {
        req.body = {
          'address-line1': validLine1,
          'address-line2': '',
          'address-city': validCity,
          'address-postcode': validPostcode,
          'address-country': validCountry,
          'telephone-number': validTeleponeNumber
        }

        const expectedUpdateServiceRequest = [
          {
            'op': 'replace',
            'path': 'merchant_details/address_line1',
            'value': validLine1
          },
          {
            'op': 'replace',
            'path': 'merchant_details/address_line2',
            'value': ''
          },
          {
            'op': 'replace',
            'path': 'merchant_details/address_city',
            'value': validCity
          },
          {
            'op': 'replace',
            'path': 'merchant_details/address_postcode',
            'value': validPostcode
          },
          {
            'op': 'replace',
            'path': 'merchant_details/address_country',
            'value': validCountry
          },
          {
            'op': 'replace',
            'path': 'merchant_details/telephone_number',
            'value': validTeleponeNumber
          },
          {
            'op': 'replace',
            'path': 'current_go_live_stage',
            'value': goLiveStage.ENTERED_ORGANISATION_ADDRESS
          }
        ]

        await controller(req, res, next)

        sinon.assert.calledWith(mockServiceService.updateService, serviceExternalId, expectedUpdateServiceRequest, correlationId)
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

    describe('COLLECT_ADDITIONAL_KYC_DATA environment variable enabled', () => {
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

      before(() => {
        process.env.COLLECT_ADDITIONAL_KYC_DATA = true
      })

      after(() => {
        process.env.COLLECT_ADDITIONAL_KYC_DATA = false
      })

      it('should update merchant details including URL and go live stage', async function () {
        const expectedUpdateServiceRequest = [
          {
            'op': 'replace',
            'path': 'merchant_details/address_line1',
            'value': validLine1
          },
          {
            'op': 'replace',
            'path': 'merchant_details/address_line2',
            'value': validLine2
          },
          {
            'op': 'replace',
            'path': 'merchant_details/address_city',
            'value': validCity
          },
          {
            'op': 'replace',
            'path': 'merchant_details/address_postcode',
            'value': validPostcode
          },
          {
            'op': 'replace',
            'path': 'merchant_details/address_country',
            'value': validCountry
          },
          {
            'op': 'replace',
            'path': 'merchant_details/telephone_number',
            'value': validTeleponeNumber
          },
          {
            'op': 'replace',
            'path': 'current_go_live_stage',
            'value': goLiveStage.ENTERED_ORGANISATION_ADDRESS
          },
          {
            'op': 'replace',
            'path': 'merchant_details/url',
            'value': validUrl
          }
        ]

        const reqWithURL = {
          correlationId,
          service: service,
          body: {
            'address-line1': validLine1,
            'address-line2': validLine2,
            'address-city': validCity,
            'address-postcode': validPostcode,
            'address-country': validCountry,
            'telephone-number': validTeleponeNumber,
            'url': validUrl
          }
        }

        const controller = getController(mockServiceService)
        await controller(reqWithURL, res, next)

        sinon.assert.calledWith(mockServiceService.updateService, serviceExternalId, expectedUpdateServiceRequest, correlationId)
        sinon.assert.calledWith(res.redirect, 303, `/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`)
      })
    })
  })
})
