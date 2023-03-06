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

    describe('request to go Live', () => {
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
        expect(pageData.isRequestToGoLive).to.equal(true)
        expect(pageData.isStripeUpdateOrgDetails).to.equal(false)
        expect(pageData.isSwitchingCredentials).to.equal(false)
        expect(pageData.isStripeSetupUserJourney).to.equal(false)

        expect(pageData.name).to.equal('Test organisation')
        expect(pageData.address_line1).to.equal('Test address line 1')
        expect(pageData.address_line2).to.equal('Test address line 2')
        expect(pageData.address_city).to.equal('London')
        expect(pageData.address_postcode).to.equal('N1 1NN')
        expect(pageData.telephone_number).to.equal('02081119900')
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

    describe('view page when `Stripe setup`', () => {
      afterEach(() => {
        process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = undefined
      })

      it('should display the `update org details` form and set `isStripeUpdateOrgDetails=true` ' +
      'and all form fields should be reset to empty', () => {
        const req = {
          url: '/your-psp/:credentialId/update-organisation-details',
          account
        }

        const controller = getController()

        controller(req, res)

        const responseData = mockResponse.getCalls()[0]

        expect(responseData.args[2]).to.equal('stripe-setup/update-org-details/index')

        const pageData = responseData.args[3]
        expect(pageData.isRequestToGoLive).to.equal(false)
        expect(pageData.isStripeUpdateOrgDetails).to.equal(true)
        expect(pageData.isSwitchingCredentials).to.equal(false)
        expect(pageData.isStripeSetupUserJourney).to.equal(true)
        expect(pageData.enableStripeOnboardingTaskList).to.equal(false)

        expect(pageData.name).to.equal(undefined)
        expect(pageData.address_line1).to.equal(undefined)
        expect(pageData.address_line2).to.equal(undefined)
        expect(pageData.address_city).to.equal(undefined)
        expect(pageData.address_postcode).to.equal(undefined)
        expect(pageData.telephone_number).to.equal(undefined)
        expect(pageData.url).to.equal(undefined)
      })

      it('should display the `update org details` form and set `enableStripeOnboardingTaskList=true` when ' +
      'Stripe task list flag is true', () => {
        process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'true'
        
        const req = {
          url: '/your-psp/:credentialId/update-organisation-details',
          account
        }

        const controller = getController()

        controller(req, res)

        const responseData = mockResponse.getCalls()[0]

        expect(responseData.args[2]).to.equal('stripe-setup/update-org-details/index')

        const pageData = responseData.args[3]
        expect(pageData.enableStripeOnboardingTaskList).to.equal(true)
      })

      it('should render error if organisation details have already been submitted', async () => {
        const req = {
          url: '/your-psp/:credentialId/update-organisation-details',
          account
        }

        req.account.connectorGatewayAccountStripeProgress.organisationDetails = true

        const controller = getController()

        controller(req, res)

        const responseData = mockResponse.getCalls()[0]
        expect(responseData.args[2]).to.equal('error-with-link')
      })
    })

    describe('view page when `Switch PSP to Stripe`', () => {
      it('should display the `update org details` form and set `isSwitchingCredentials=true` ' +
      'and all form fields should be reset to empty', () => {
        const req = {
          url: '/switch-psp/:credentialId/update-organisation-details',
          account
        }

        const controller = getController()

        controller(req, res)

        const responseData = mockResponse.getCalls()[0]

        expect(responseData.args[2]).to.equal('stripe-setup/update-org-details/index')

        const pageData = responseData.args[3]
        expect(pageData.isRequestToGoLive).to.equal(false)
        expect(pageData.isStripeUpdateOrgDetails).to.equal(false)
        expect(pageData.isSwitchingCredentials).to.equal(true)
        expect(pageData.isStripeSetupUserJourney).to.equal(true)

        expect(pageData.name).to.equal(undefined)
        expect(pageData.address_line1).to.equal(undefined)
        expect(pageData.address_line2).to.equal(undefined)
        expect(pageData.address_city).to.equal(undefined)
        expect(pageData.address_postcode).to.equal(undefined)
        expect(pageData.telephone_number).to.equal(undefined)
        expect(pageData.url).to.equal(undefined)
      })

      it('should render error if organisation details have already been submitted', async () => {
        const req = {
          url: '/switch-psp/:credentialId/update-organisation-details',
          account
        }

        req.account.connectorGatewayAccountStripeProgress.organisationDetails = true

        const controller = getController()

        controller(req, res)

        const responseData = mockResponse.getCalls()[0]
        expect(responseData.args[2]).to.equal('error-with-link')
      })
    })

    describe('view page when not `request to go live` or `Stripe setup`', () => {
      it('should display the org address page and set `isStripeUpdateOrgDetails=false` & `isRequestToGoLive=false`', () => {
        const service = new Service(serviceFixtures.validServiceResponse({
          current_go_live_stage: goLiveStage.ENTERED_ORGANISATION_NAME,
          merchant_details: merchantDetails
        }))

        const req = {
          route: {
            path: '/organisation-details'
          },
          account,
          service
        }

        const controller = getController()

        controller(req, res)

        const responseData = mockResponse.getCalls()[0]

        expect(responseData.args[2]).to.equal('request-to-go-live/organisation-address')

        const pageData = responseData.args[3]
        expect(pageData.isRequestToGoLive).to.equal(false)
        expect(pageData.isStripeUpdateOrgDetails).to.equal(false)
        expect(pageData.isSwitchingCredentials).to.equal(false)
        expect(pageData.isStripeSetupUserJourney).to.equal(false)

        expect(pageData.name).to.equal('Test organisation')
        expect(pageData.address_line1).to.equal('Test address line 1')
        expect(pageData.address_line2).to.equal('Test address line 2')
        expect(pageData.address_city).to.equal('London')
        expect(pageData.address_postcode).to.equal('N1 1NN')
        expect(pageData.telephone_number).to.equal('02081119900')
        expect(pageData.url).to.equal('http://www.example.com')
      })
    })
  })
})
