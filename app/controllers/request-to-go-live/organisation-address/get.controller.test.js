'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { expect } = require('chai')

const goLiveStage = require('../../../models/go-live-stage')
const Service = require('../../../models/Service.class')
const serviceFixtures = require('../../../../test/fixtures/service.fixtures')

const mockResponse = sinon.spy()

const getController = function getController () {
  return proxyquire('./get.controller', {
    '../../../utils/response': {
      response: mockResponse
    }
  })
}

const correlationId = 'correlation-id'

describe('organisation address get controller', () => {
  describe('check validation', () => {
    let res

    beforeEach(() => {
      res = {
        redirect: sinon.spy(),
        render: sinon.spy()
      }
      mockResponse.resetHistory()
    })

    describe('request to go Live', () => {
      it('should display the org address page and set `isRequestToGoLive=true`', () => {
        const service = new Service(serviceFixtures.validServiceResponse({
          current_go_live_stage: goLiveStage.ENTERED_ORGANISATION_NAME
        }))

        const req = {
          route: {
            path: '/request-to-go-live/organisation-address'
          },
          correlationId,
          service
        }

        const controller = getController()

        controller(req, res)

        const responseData = mockResponse.getCalls()[0]

        expect(responseData.args[2]).to.equal('request-to-go-live/organisation-address')

        const pageData = responseData.args[3]
        expect(pageData.isRequestToGoLive).to.equal(true)
        expect(pageData.isStripeUpdateOrgDetails).to.equal(false)
      })

      it('when the organisation name has not been entered, should redirect to the `request to go live index`', () => {
        const service = new Service(serviceFixtures.validServiceResponse({
          current_go_live_stage: null
        }))

        const req = {
          route: {
            path: '/request-to-go-live/organisation-address'
          },
          service
        }

        const controller = getController()

        controller(req, res)

        sinon.assert.calledWith(res.redirect, 303, '/service/cp5wa/request-to-go-live')
      })
    })

    describe('view page when `Stripe setup`', () => {
      it('should display the org address page and set `isStripeUpdateOrgDetails=true`', () => {
        const req = {
          route: {
            path: '/your-psp/:credentialId/update-organisation-details'
          }
        }

        const controller = getController()

        controller(req, res)

        const responseData = mockResponse.getCalls()[0]

        expect(responseData.args[2]).to.equal('request-to-go-live/organisation-address')

        const pageData = responseData.args[3]
        expect(pageData.isStripeUpdateOrgDetails).to.equal(true)
        expect(pageData.isRequestToGoLive).to.equal(false)
      })
    })

    describe('view page when not `request to go live` or `Stripe setup`', () => {
      it('should display the org address page and set `isStripeUpdateOrgDetails=false` & `isRequestToGoLive=false`', () => {
        const req = {
          route: {
            path: '/organisation-details'
          }
        }

        const controller = getController()

        controller(req, res)

        const responseData = mockResponse.getCalls()[0]

        expect(responseData.args[2]).to.equal('request-to-go-live/organisation-address')

        const pageData = responseData.args[3]
        expect(pageData.isStripeUpdateOrgDetails).to.equal(false)
        expect(pageData.isRequestToGoLive).to.equal(false)
      })
    })
  })
})
