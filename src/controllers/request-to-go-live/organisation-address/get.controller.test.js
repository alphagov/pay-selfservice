'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { expect } = require('chai')

const goLiveStage = require('@models/constants/go-live-stage')
const Service = require('@models/service/Service.class')
const serviceFixtures = require('../../../../test/fixtures/service.fixtures')

const mockResponse = sinon.spy()

const getController = function getController () {
  return proxyquire('./get.controller', {
    '../../../utils/response': {
      response: mockResponse
    }
  })
}

const merchantDetails = {
  name: 'Test organisation',
  address_line1: 'Test address line 1',
  address_line2: 'Test address line 2',
  address_city: 'London',
  address_postcode: 'N1 1NN',
  telephone_number: '02081119900',
  url: 'http://www.example.com'
}

describe('organisation address get controller', () => {
  describe('check validation', () => {
    let res
    let account

    beforeEach(() => {
      account = {
        connectorGatewayAccountStripeProgress: {
          organisationDetails: false
        }
      }

      res = {
        redirect: sinon.spy(),
        render: sinon.spy()
      }
      mockResponse.resetHistory()
    })

    it('should display the org address page and set `isRequestToGoLive=true` and set form data correctly', () => {
        const service = new Service(serviceFixtures.validServiceResponse({
          current_go_live_stage: goLiveStage.ENTERED_ORGANISATION_NAME,
          merchant_details: merchantDetails
        }))

        const req = {
          route: {
            path: '/request-to-go-live/organisation-address'
          },
          service,
          account
        }

        const controller = getController()

        controller(req, res)

        const responseData = mockResponse.getCalls()[0]

        expect(responseData.args[2]).to.equal('request-to-go-live/organisation-address')

        const pageData = responseData.args[3]

        expect(pageData.name).to.equal('Test organisation')
        expect(pageData.addressLine1).to.equal('Test address line 1')
        expect(pageData.addressLine2).to.equal('Test address line 2')
        expect(pageData.addressCity).to.equal('London')
        expect(pageData.addressPostcode).to.equal('N1 1NN')
        expect(pageData.telephoneNumber).to.equal('02081119900')
        expect(pageData.url).to.equal('http://www.example.com')
      })

    it('when the organisation name has not been entered, should redirect to the `request to go live index`', () => {
      const service = new Service(serviceFixtures.validServiceResponse({
        current_go_live_stage: null
      }))

      const req = {
        route: {
          path: '/request-to-go-live/organisation-address'
        },
        service,
        account
      }

      const controller = getController()

      controller(req, res)

      sinon.assert.calledWith(res.redirect, 303, '/service/cp5wa/request-to-go-live')
    })
  })
})
