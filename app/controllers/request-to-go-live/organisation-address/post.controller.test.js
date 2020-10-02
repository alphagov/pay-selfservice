'use strict'

const sinon = require('sinon')

const goLiveStage = require('../../../models/go-live-stage')
const Service = require('../../../models/Service.class')
const serviceFixtures = require('../../../../test/fixtures/service.fixtures')

const mockResponse = {}
jest.mock('../../../services/service.service', () => mockServiceService);
jest.mock('../../../utils/response', () => mockResponse);
const getController = function getController (mockServiceService) {
  return require('./post.controller');
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

    const service = new Service(serviceFixtures.validServiceResponse({
      external_id: serviceExternalId,
      current_go_live_stage: goLiveStage.ENTERED_ORGANISATION_NAME
    }).getPlain())

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

    let res
    beforeEach(() => {
      res = {
        setHeader: sinon.stub(),
        status: sinon.spy(),
        redirect: sinon.spy(),
        render: sinon.spy()
      }
      mockResponse.renderErrorView = sinon.spy()
    })

    describe('service update success', () => {
      const updatedService = new Service(serviceFixtures.validServiceResponse({
        external_id: serviceExternalId,
        current_go_live_stage: goLiveStage.ENTERED_ORGANISATION_ADDRESS
      }).getPlain())

      const mockUpdateService = sinon.spy(() => {
        return new Promise(resolve => {
          resolve(updatedService)
        })
      })

      const mockServiceService = { updateService: mockUpdateService }
      const controller = getController(mockServiceService)

      it('should update merchant details and go live stage', async () => {
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

        await controller(req, res)

        expect(mockServiceService.updateService.calledWith(serviceExternalId, expectedUpdateServiceRequest, correlationId)).toBe(true)
        expect(res.redirect.calledWith(303, `/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`)).toBe(true)
      })

      it(
        'should submit empty strings for optional fields left blank',
        async () => {
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

          await controller(req, res)

          expect(mockServiceService.updateService.calledWith(serviceExternalId, expectedUpdateServiceRequest, correlationId)).toBe(true)
          expect(res.redirect.calledWith(303, `/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`)).toBe(true)
        }
      )
    })

    describe('error updating service', () => {
      it(
        'should show an error page if updating service throws error',
        async () => {
          const mockUpdateService = sinon.spy(() => {
            return new Promise((resolve, reject) => {
              reject(new Error())
            })
          })
          const mockServiceService = { updateService: mockUpdateService }
          const controller = getController(mockServiceService)

          await controller(req, res)
          expect(mockResponse.renderErrorView.called).toBe(true)
        }
      )
    })
  })
})
