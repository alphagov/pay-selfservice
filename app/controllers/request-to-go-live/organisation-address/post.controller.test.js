'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')

const goLiveStage = require('../../../models/go-live-stage')
const Service = require('../../../models/Service.class')
const serviceFixtures = require('../../../../test/fixtures/service.fixtures')
const gatewayAccountFixtures = require('../../../../test/fixtures/gateway-account.fixtures')
const userFixtures = require('../../../../test/fixtures/user.fixtures')
const User = require('../../../models/User.class')
const paths = require('../../../paths')

const mockResponse = {}
let updateOrganisationDetailsMock, completeKycMock, updateServiceMock, isKycTaskListCompleteMock

const correlationId = 'correlation-id'
const serviceExternalId = 'abc123'
const credentialId = 'a-credential-id'
const accountExternalId = 'a-valid-external-id'
const stripeAccountId = 'acct_123example123'

const validName = 'HMRC'
const validLine1 = 'A building'
const validLine2 = 'A street'
const validCity = 'A city'
const validCountry = 'GB'
const validPostcode = 'E1 8QS'
const validTelephoneNumber = '01134960000'
const validUrl = 'https://www.example.com'

const getController = function getController () {
  return proxyquire('./post.controller', {
    '../../../services/service.service': {
      updateService: updateServiceMock
    },
    '../../../utils/response': mockResponse,
    '../../../services/clients/stripe/stripe.client': {
      updateOrganisationDetails: updateOrganisationDetailsMock
    },
    '../../stripe-setup/stripe-setup.util': {
      getStripeAccountId: () => {
        return Promise.resolve(stripeAccountId)
      },
      completeKyc: completeKycMock
    },
    '../../../controllers/your-psp/kyc-tasks.service': {
      isKycTaskListComplete: () => isKycTaskListCompleteMock
    }
  })
}

function getExpectedUpdateServiceRequest () {
  const expectedUpdateServiceRequest = [
    { 'op': 'replace', 'path': 'merchant_details/address_line1', 'value': validLine1 },
    { 'op': 'replace', 'path': 'merchant_details/address_line2', 'value': validLine2 },
    { 'op': 'replace', 'path': 'merchant_details/address_city', 'value': validCity },
    { 'op': 'replace', 'path': 'merchant_details/address_postcode', 'value': validPostcode },
    { 'op': 'replace', 'path': 'merchant_details/address_country', 'value': validCountry },
    { 'op': 'replace', 'path': 'merchant_details/telephone_number', 'value': validTelephoneNumber },
    { 'op': 'replace', 'path': 'merchant_details/url', 'value': validUrl },
    { 'op': 'replace', 'path': 'merchant_details/name', 'value': 'HMRC' }
  ]
  return expectedUpdateServiceRequest
}

function getValidRequestBody (withMerchantName = false) {
  const payload = {
    'address-line1': validLine1,
    'address-line2': validLine2,
    'address-city': validCity,
    'address-postcode': validPostcode,
    'address-country': validCountry,
    'telephone-number': validTelephoneNumber,
    'url': validUrl
  }
  if (withMerchantName) {
    payload['merchant-name'] = validName
  }
  return payload
}

describe('organisation address post controller', () => {
  describe('request to go live', () => {
    describe('successful submission', () => {
      const service = new Service(serviceFixtures.validServiceResponse({
        external_id: serviceExternalId,
        current_go_live_stage: goLiveStage.ENTERED_ORGANISATION_NAME
      }))

      const req = {
        route: {
          path: '/request-to-go-live/organisation-address'
        },
        correlationId,
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

        updateServiceMock = sinon.spy(() => {
          return new Promise(resolve => {
            resolve(updatedService)
          })
        })

        const controller = getController()

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

          sinon.assert.calledWith(updateServiceMock, serviceExternalId, expectedUpdateServiceRequest, correlationId)
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

          sinon.assert.calledWith(updateServiceMock, serviceExternalId, expectedUpdateServiceRequest, correlationId)
          sinon.assert.calledWith(res.redirect, 303, `/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`)
        })
      })

      describe('error updating service', () => {
        it('should call next with error', async function () {
          const err = new Error('an error')
          updateServiceMock = () => Promise.reject(err)
          const controller = getController()

          await controller(req, res, next)
          sinon.assert.calledWith(next, err)
        })
      })
    })
  })

  describe('organisation details page not part of request to go live', () => {
    const service = new Service(serviceFixtures.validServiceResponse({
      external_id: serviceExternalId,
      current_go_live_stage: goLiveStage.ENTERED_ORGANISATION_NAME
    }))

    const req = {
      route: {
        path: '/organisation-details/edit'
      },
      correlationId,
      service: service,
      body: getValidRequestBody(true)
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
      updateServiceMock = sinon.spy(() => {
        return new Promise(resolve => {
          resolve(
            new Service(serviceFixtures.validServiceResponse({
              external_id: serviceExternalId,
              current_go_live_stage: goLiveStage.ENTERED_ORGANISATION_ADDRESS
            }))
          )
        })
      })
    })

    describe('service update success', () => {
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
            'value': validTelephoneNumber
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

        const controller = getController()
        await controller(req, res, next)

        sinon.assert.calledWith(updateServiceMock, serviceExternalId, expectedUpdateServiceRequest, correlationId)
        sinon.assert.calledWith(res.redirect, 303, `/service/${serviceExternalId}/organisation-details`)
      })
    })
  })

  describe('Stripe KYC and switch PSP', () => {
    const account = gatewayAccountFixtures.validGatewayAccountResponse({
      gateway_account_credentials: [{ external_id: credentialId }]
    })
    const user = new User(userFixtures.validUserResponse())
    const service = user.serviceRoles[0].service

    let req, next, res

    beforeEach(() => {
      req = {
        correlationId: 'correlation-id',
        account: {
          ...account,
          connectorGatewayAccountStripeProgress: {}
        },
        user,
        service,
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
      req.body = getValidRequestBody(true)
      completeKycMock = sinon.spy(() => Promise.resolve())
      updateOrganisationDetailsMock = sinon.spy(() => Promise.resolve())
      updateServiceMock = sinon.spy(() => Promise.resolve())
      isKycTaskListCompleteMock = Promise.resolve(true)
    })

    it('Stripe KYC - should update service, organisation details on stripe and redirect to Your PSP', async () => {
      req.account.requires_additional_kyc_data = true
      req.route = {
        path: paths.account.kyc.organisationDetails
      }
      isKycTaskListCompleteMock = Promise.resolve(false)
      const controller = getController()
      await controller(req, res, next)

      const expectedUpdateServiceRequest = getExpectedUpdateServiceRequest()

      sinon.assert.calledWith(updateServiceMock, 'cp5wa', expectedUpdateServiceRequest, 'correlation-id')
      sinon.assert.calledWith(updateOrganisationDetailsMock, res.locals.stripeAccount.stripeAccountId, getValidRequestBody(true))
      sinon.assert.calledWith(res.redirect, 303, `/account/${accountExternalId}/your-psp/${credentialId}`)
      sinon.assert.calledWith(req.flash, 'generic', 'Organisation details updated successfully')
      sinon.assert.notCalled(completeKycMock)
    })

    it('Stripe KYC - should mark KYC as completed if all tasks are completed', async () => {
      req.account.requires_additional_kyc_data = true
      req.route = {
        path: paths.account.kyc.organisationDetails
      }
      const controller = getController()
      await controller(req, res, next)

      const expectedUpdateServiceRequest = getExpectedUpdateServiceRequest()

      sinon.assert.calledWith(updateServiceMock, 'cp5wa', expectedUpdateServiceRequest, 'correlation-id')
      sinon.assert.calledWith(updateOrganisationDetailsMock, res.locals.stripeAccount.stripeAccountId, getValidRequestBody(true))
      sinon.assert.calledWith(res.redirect, 303, `/account/${accountExternalId}/your-psp/${credentialId}`)

      sinon.assert.calledWith(req.flash, 'generic', 'You’ve successfully added all the Know your customer details for this service.')
      sinon.assert.calledWith(completeKycMock, req.account.gateway_account_id, req.service, stripeAccountId, req.correlationId)
    })

    it('Switch PSP - should update service, organisation details on stripe and redirect to switch PSP index', async () => {
      req.route = {
        path: paths.account.switchPSP.organisationDetails
      }

      const controller = getController()
      await controller(req, res, next)

      const expectedUpdateServiceRequest = getExpectedUpdateServiceRequest()

      sinon.assert.calledWith(updateServiceMock, 'cp5wa', expectedUpdateServiceRequest, 'correlation-id')
      sinon.assert.calledWith(updateOrganisationDetailsMock, res.locals.stripeAccount.stripeAccountId, getValidRequestBody(true))
      sinon.assert.calledWith(res.redirect, 303, `/account/${accountExternalId}/switch-psp`)
      sinon.assert.notCalled(completeKycMock)
    })
  })
})
