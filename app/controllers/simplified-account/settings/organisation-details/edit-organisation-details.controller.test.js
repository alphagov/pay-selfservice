const sinon = require('sinon')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const chai = require('chai')
const sinonChai = require('sinon-chai')
chai.use(sinonChai)
const expect = chai.expect
const Service = require('@models/Service.class')

const mockResponse = sinon.spy()
const updateServiceSpy = sinon.spy()

const ACCOUNT_TYPE = 'live'
const SERVICE_ID = 'service-id-123abc'

const { req, res, call, nextRequest } = new ControllerTestBuilder('@controllers/simplified-account/settings/organisation-details/edit-organisation-details.controller')
  .withService(new Service({
    id: '123',
    external_id: SERVICE_ID,
    merchant_details: {
      name: 'Compu-Global-Hyper-Mega-Net',
      address_line1: '742 Evergreen Terrace',
      address_city: 'Springfield',
      address_postcode: 'SP21NG',
      address_country: 'US',
      telephone_number: '01234567890',
      url: 'https://www.cpghm.example.com'
    }
  }))
  .withAccountType(ACCOUNT_TYPE)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@govuk-pay/pay-js-commons': { utils: { countries: { govukFrontendFormatted: () => [] } } },
    '@services/service.service': { updateService: updateServiceSpy }
  })
  .build()

describe('Controller: settings/organisation-details', () => {
  describe('get', () => {
    before(() => {
      call('get')
    })

    it('should call the response method', () => {
      expect(mockResponse).to.have.been.calledOnce // eslint-disable-line no-unused-expressions
    })

    it('should call the response method with req, res, and template path', () => {
      expect(mockResponse).to.have.been.calledWith(req, res, 'simplified-account/settings/organisation-details/edit-organisation-details')
    })

    it('should pass the context to the response method', () => {
      expect(mockResponse).to.have.been.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, {
        messages: [],
        organisationDetails: {
          organisationName: 'Compu-Global-Hyper-Mega-Net',
          addressLine1: '742 Evergreen Terrace',
          addressLine2: '',
          addressCity: 'Springfield',
          addressPostcode: 'SP21NG',
          addressCountry: 'US',
          telephoneNumber: '01234567890',
          organisationUrl: 'https://www.cpghm.example.com'
        },
        submitLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.organisationDetails.edit, SERVICE_ID, ACCOUNT_TYPE),
        countries: []
      })
    })
  })

  describe('post', () => {
    before(() => {
      nextRequest({
        service: new Service({
          id: '123',
          external_id: SERVICE_ID
        }),
        account: {
          type: ACCOUNT_TYPE
        },
        body: {
          organisationName: 'Flancrest Enterprises',
          addressLine1: '744 Evergreen Terrace',
          addressLine2: '',
          addressCity: 'Springfield',
          addressPostcode: 'SP21NG',
          addressCountry: 'US',
          telephoneNumber: '09876543210',
          organisationUrl: 'https://www.flancrest.example.com'
        }
      })
      call('post', 1)
    })

    it('should call the updateService method with the correct PATCH request', () => {
      expect(updateServiceSpy).to.have.been.calledOnce // eslint-disable-line no-unused-expressions
      expect(updateServiceSpy).to.have.been.calledWith(SERVICE_ID, [
        {
          op: 'replace',
          value: 'Flancrest Enterprises',
          path: 'merchant_details/name'
        },
        {
          op: 'replace',
          value: '744 Evergreen Terrace',
          path: 'merchant_details/address_line1'
        },
        {
          op: 'replace',
          value: '',
          path: 'merchant_details/address_line2'
        },
        {
          op: 'replace',
          value: 'Springfield',
          path: 'merchant_details/address_city'
        },
        {
          op: 'replace',
          value: 'SP21NG',
          path: 'merchant_details/address_postcode'
        },
        {
          op: 'replace',
          value: 'US',
          path: 'merchant_details/address_country'
        },
        {
          op: 'replace',
          value: '09876543210',
          path: 'merchant_details/telephone_number'
        },
        {
          op: 'replace',
          value: 'https://www.flancrest.example.com',
          path: 'merchant_details/url'
        }
      ])
    })
  })
})
