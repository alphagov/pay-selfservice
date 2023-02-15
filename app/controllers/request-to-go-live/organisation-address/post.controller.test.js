'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { expect } = require('chai')

const goLiveStage = require('../../../models/go-live-stage')
const Service = require('../../../models/Service.class')
const serviceFixtures = require('../../../../test/fixtures/service.fixtures')
const gatewayAccountFixture = require('../../../../test/fixtures/gateway-account.fixtures')

const mockResponse = sinon.spy()

const loggerInfoMock = sinon.spy()
const stripeAccountId = 'acct_123example123'
const setStripeAccountSetupFlagMock = sinon.spy(() => Promise.resolve())
const updateStripeAccountMock = sinon.spy(() => Promise.resolve())

const stubGetStripeAccountId = sinon.stub().resolves(stripeAccountId)

const getController = function getController (mockServiceService) {
  return proxyquire('./post.controller', {
    '../../../services/service.service': mockServiceService,
    '../../../services/clients/connector.client': {
      ConnectorClient: function () {
        this.setStripeAccountSetupFlag = setStripeAccountSetupFlagMock
      }
    },
    '../../../utils/response': {
      response: mockResponse
    },
    '../../../controllers/stripe-setup/stripe-setup.util': {
      getStripeAccountId: (...params) => {
        return stubGetStripeAccountId(...params)
      }
    },
    '../../../utils/logger': function (filename) {
      return {
        info: loggerInfoMock
      }
    },
    '../../../services/clients/stripe/stripe.client': {
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
    it('should return error where organisation name is more than 100 characters', () => {
      const invalidName = 'a'.repeat(101)
      const req = {
        route: {
          path: '/organisation-details/edit'
        },
        body: {
          'merchant-name': invalidName
        }
      }

      controller(req, res, next)
      responseData = mockResponse.getCalls()[0]

      const errors = responseData.args[3].errors
      expect(errors[errorKeysAndMessage.errorName.key]).to.equal('Name must be 100 characters or fewer')
    })

    describe('request to go live', () => {
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

      it('should set the flag `isRequestToGoLive=true`', () => {
        expect(responseData.args[3].isRequestToGoLive).to.equal(true)
        expect(responseData.args[3].isStripeUpdateOrgDetails).to.equal(false)
        expect(responseData.args[3].isSwitchingCredentials).to.equal(false)
        expect(responseData.args[3].isStripeSetupUserJourney).to.equal(false)
      })
    })

    describe('manage organisation details', () => {
      beforeEach(() => {
        req.route.path = '/organisation-details'
        controller(req, res, next)
        responseData = mockResponse.getCalls()[0]
      })

      it('should return errors when the required fields are missing', () => {
        expect(responseData.args[2]).to.equal('request-to-go-live/organisation-address')

        const errors = responseData.args[3].errors
        expect(Object.keys(errors).length).to.equal(6)
        expect(errors[errorKeysAndMessage.errorName.key]).to.equal(errorKeysAndMessage.errorName.text)
        expect(errors[errorKeysAndMessage.errorAddressLine1.key]).to.equal(errorKeysAndMessage.errorAddressLine1.text)
        expect(errors[errorKeysAndMessage.errorAddressCity.key]).to.equal(errorKeysAndMessage.errorAddressCity.text)
        expect(errors[errorKeysAndMessage.errorAddressPostcode.key]).to.equal(errorKeysAndMessage.errorAddressPostcode.text)
        expect(errors[errorKeysAndMessage.errorTelephoneNumber.key]).to.equal(errorKeysAndMessage.errorTelephoneNumber.text)
        expect(errors[errorKeysAndMessage.errorWebsiteAddress.key]).to.equal(errorKeysAndMessage.errorWebsiteAddress.text)
      })

      it('should set all the flags to false', () => {
        expect(responseData.args[3].isRequestToGoLive).to.equal(false)
        expect(responseData.args[3].isStripeUpdateOrgDetails).to.equal(false)
        expect(responseData.args[3].isSwitchingCredentials).to.equal(false)
        expect(responseData.args[3].isStripeSetupUserJourney).to.equal(false)
      })
    })

    describe('new Stripe gateway account`', () => {
      beforeEach(() => {
        req.url = '/your-psp/:credentialId/update-organisation-details'
        req.route.path = '/update-organisation-details'
        controller(req, res, next)
        responseData = mockResponse.getCalls()[0]
      })

      it('should return errors when the required fields are missing', () => {
        expect(responseData.args[2]).to.equal('stripe-setup/update-org-details/index')

        const errors = responseData.args[3].errors
        expect(Object.keys(errors).length).to.equal(4)
        expect(errors[errorKeysAndMessage.errorName.key]).to.equal(errorKeysAndMessage.errorName.text)
        expect(errors[errorKeysAndMessage.errorAddressLine1.key]).to.equal(errorKeysAndMessage.errorAddressLine1.text)
        expect(errors[errorKeysAndMessage.errorAddressCity.key]).to.equal(errorKeysAndMessage.errorAddressCity.text)
        expect(errors[errorKeysAndMessage.errorAddressPostcode.key]).to.equal(errorKeysAndMessage.errorAddressPostcode.text)
      })

      it('should set the flags `isStripeUpdateOrgDetails=true` & `isStripeSetupUserJourney=true', () => {
        expect(responseData.args[3].isRequestToGoLive).to.equal(false)
        expect(responseData.args[3].isStripeUpdateOrgDetails).to.equal(true)
        expect(responseData.args[3].isSwitchingCredentials).to.equal(false)
        expect(responseData.args[3].isStripeSetupUserJourney).to.equal(true)
      })
    })

    describe('`Switch PSP > Stripe`', () => {
      beforeEach(() => {
        req.url = '/switch-psp/:credentialId/update-organisation-details'
        req.route.path = '/update-organisation-details'
        controller(req, res, next)
        responseData = mockResponse.getCalls()[0]
      })

      it('should return errors when the required fields are missing', () => {
        expect(responseData.args[2]).to.equal('stripe-setup/update-org-details/index')

        const errors = responseData.args[3].errors
        expect(Object.keys(errors).length).to.equal(4)
        expect(errors[errorKeysAndMessage.errorName.key]).to.equal(errorKeysAndMessage.errorName.text)
        expect(errors[errorKeysAndMessage.errorAddressLine1.key]).to.equal(errorKeysAndMessage.errorAddressLine1.text)
        expect(errors[errorKeysAndMessage.errorAddressCity.key]).to.equal(errorKeysAndMessage.errorAddressCity.text)
        expect(errors[errorKeysAndMessage.errorAddressPostcode.key]).to.equal(errorKeysAndMessage.errorAddressPostcode.text)
      })

      it('should set the flags `isSwitchingCredentials=true` & `isStripeSetupUserJourney=true', () => {
        expect(responseData.args[3].isRequestToGoLive).to.equal(false)
        expect(responseData.args[3].isStripeUpdateOrgDetails).to.equal(false)
        expect(responseData.args[3].isSwitchingCredentials).to.equal(true)
        expect(responseData.args[3].isStripeSetupUserJourney).to.equal(true)
      })
    })
  })

  describe('Form submissions', () => {
    describe('request to go live', () => {
      describe('successful submission', () => {
        const service = new Service(serviceFixtures.validServiceResponse({
          external_id: serviceExternalId,
          current_go_live_stage: goLiveStage.ENTERED_ORGANISATION_NAME
        }))

        let req = {
          route: {
            path: '/request-to-go-live/organisation-address'
          },
          service: service,
          body: {
            'address-line1': validLine1,
            'address-line2': validLine2,
            'address-city': validCity,
            'address-postcode': validPostcode,
            'address-country': validCountry,
            'telephone-number': validTelephoneNumber,
            'url': validUrl
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
                'value': validTelephoneNumber
              },
              {
                'op': 'replace',
                'path': 'merchant_details/url',
                'value': validUrl
              },
              {
                'op': 'replace',
                'path': 'current_go_live_stage',
                'value': goLiveStage.ENTERED_ORGANISATION_ADDRESS
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
              'url': validUrl
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
                'value': validTelephoneNumber
              },
              {
                'op': 'replace',
                'path': 'merchant_details/url',
                'value': validUrl
              },
              {
                'op': 'replace',
                'path': 'current_go_live_stage',
                'value': goLiveStage.ENTERED_ORGANISATION_ADDRESS
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

    describe('Manage organisation details page', () => {
      const serviceExternalId = 'abc123'
      const validName = 'HMRC'
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
        route: {
          path: '/organisation-details/edit'
        },
        service: service,
        body: {
          'merchant-name': validName,
          'address-line1': validLine1,
          'address-line2': validLine2,
          'address-city': validCity,
          'address-postcode': validPostcode,
          'address-country': validCountry,
          'telephone-number': validTeleponeNumber,
          'url': validUrl
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

        it('should update merchant details', async function () {
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
              'path': 'merchant_details/url',
              'value': validUrl
            },
            {
              'op': 'replace',
              'path': 'merchant_details/name',
              'value': validName
            }
          ]

          const controller = getController(mockServiceService)
          await controller(req, res, next)

          sinon.assert.calledWith(mockServiceService.updateService, serviceExternalId, expectedUpdateServiceRequest)
          sinon.assert.calledWith(res.redirect, 303, `/service/${serviceExternalId}/organisation-details`)
        })
      })
    })

    describe('Setup new Stripe account', () => {
      const serviceExternalId = 'abc123'
      const validName = 'HMRC'
      const validLine1 = 'A building'
      const validLine2 = 'A street'
      const validCity = 'A city'
      const validCountry = 'GB'
      const validPostcode = 'E1 8QS'

      const service = new Service(serviceFixtures.validServiceResponse({
        external_id: serviceExternalId,
        current_go_live_stage: goLiveStage.ENTERED_ORGANISATION_NAME
      }))

      let req, res, next

      beforeEach(() => {
        req = {
          account: gatewayAccountFixture.validGatewayAccount({}),
          url: '/your-psp/:credentialId/update-organisation-details',
          service: service,
          body: {
            'merchant-name': validName,
            'address-line1': validLine1,
            'address-line2': validLine2,
            'address-city': validCity,
            'address-postcode': validPostcode,
            'address-country': validCountry
          }
        }

        res = {
          setHeader: sinon.stub(),
          status: sinon.spy(),
          redirect: sinon.spy(),
          render: sinon.spy()
        }
        next = sinon.spy()
        mockResponse.renderErrorView = sinon.spy()
        stubGetStripeAccountId.resetHistory()
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

        it('should update Stripe and redirect to `Stripe > add psp details`', async function () {
          await controller(req, res, next)

          sinon.assert.calledWith(updateStripeAccountMock, stripeAccountId, {
            name: validName,
            address_line1: validLine1,
            address_line2: validLine2,
            address_city: validCity,
            address_postcode: validPostcode,
            address_country: validCountry
          })

          const isSwitchingCredentials = false
          sinon.assert.calledWith(stubGetStripeAccountId, req.account, isSwitchingCredentials)
          sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'organisation_details')
          sinon.assert.calledWith(loggerInfoMock, 'Organisation details updated for Stripe account', { stripe_account_id: stripeAccountId })
          sinon.assert.calledWith(res.redirect, 303, '/account/a-valid-external-id/stripe/add-psp-account-details')
        })

        it('when `address-line2` is empty, it should not call the Stripe client with address line 2', async function () {
          req.body['address-line2'] = ''

          await controller(req, res, next)

          sinon.assert.calledWith(updateStripeAccountMock, stripeAccountId, {
            name: validName,
            address_line1: validLine1,
            address_city: validCity,
            address_postcode: validPostcode,
            address_country: validCountry
          })
        })
        it('should update Stripe and redirect to task-list page when ENABLE_STRIPE_ONBOARDING_TASK_LIST is true', async () => {
          process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'true'

          req.params = {
            credentialId: 'a-valid-credential-external-id'
          }
          await controller(req, res, next)

          sinon.assert.calledWith(updateStripeAccountMock, stripeAccountId, {
            name: validName,
            address_line1: validLine1,
            address_line2: validLine2,
            address_city: validCity,
            address_postcode: validPostcode,
            address_country: validCountry
          })

          sinon.assert.calledWith(stubGetStripeAccountId, req.account)

          sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'organisation_details')
          sinon.assert.calledWith(loggerInfoMock, 'Organisation details updated for Stripe account', { stripe_account_id: stripeAccountId })
          sinon.assert.calledWith(res.redirect, 303, `/account/a-valid-external-id/your-psp/a-valid-credential-external-id`)
        })
      })
    })

    describe('Switch PSP > Stripe', () => {
      const serviceExternalId = 'abc123'
      const validName = 'HMRC'
      const validLine1 = 'A building'
      const validLine2 = 'A street'
      const validCity = 'A city'
      const validCountry = 'GB'
      const validPostcode = 'E1 8QS'

      const service = new Service(serviceFixtures.validServiceResponse({
        external_id: serviceExternalId,
        current_go_live_stage: goLiveStage.ENTERED_ORGANISATION_NAME
      }))

      let req, res, next

      beforeEach(() => {
        req = {
          account: gatewayAccountFixture.validGatewayAccount({}),
          url: '/switch-psp/:credentialId/update-organisation-details',
          service: service,
          body: {
            'merchant-name': validName,
            'address-line1': validLine1,
            'address-line2': validLine2,
            'address-city': validCity,
            'address-postcode': validPostcode,
            'address-country': validCountry
          }
        }

        res = {
          setHeader: sinon.stub(),
          status: sinon.spy(),
          redirect: sinon.spy(),
          render: sinon.spy()
        }
        next = sinon.spy()
        mockResponse.renderErrorView = sinon.spy()
        stubGetStripeAccountId.resetHistory()
      })

      afterEach(() => {
        process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'false'
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

        it('should update Stripe and redirect to `Switch PSP > Stripe index page`', async function () {
          await controller(req, res, next)

          sinon.assert.calledWith(updateStripeAccountMock, stripeAccountId, {
            name: validName,
            address_line1: validLine1,
            address_line2: validLine2,
            address_city: validCity,
            address_postcode: validPostcode,
            address_country: validCountry
          })

          const isSwitchingCredentials = true
          sinon.assert.calledWith(stubGetStripeAccountId, req.account, isSwitchingCredentials)
          sinon.assert.calledWith(setStripeAccountSetupFlagMock, req.account.gateway_account_id, 'organisation_details')
          sinon.assert.calledWith(loggerInfoMock, 'Organisation details updated for Stripe account', { stripe_account_id: stripeAccountId })
          sinon.assert.calledWith(res.redirect, 303, '/account/a-valid-external-id/switch-psp')
        })

        it('when `address-line2` is empty, it should not call the Stripe client with address line 2', async function () {
          req.body['address-line2'] = ''

          await controller(req, res, next)

          sinon.assert.calledWith(updateStripeAccountMock, stripeAccountId, {
            name: validName,
            address_line1: validLine1,
            address_city: validCity,
            address_postcode: validPostcode,
            address_country: validCountry
          })
        })
      })
    })
  })
})
