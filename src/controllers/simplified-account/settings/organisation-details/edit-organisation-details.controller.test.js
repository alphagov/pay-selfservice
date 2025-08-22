const sinon = require('sinon')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const chai = require('chai')
const expect = chai.expect

const mockResponse = sinon.stub()
const updateServiceSpy = sinon.spy()

const ACCOUNT_TYPE = 'live'
const SERVICE_EXTERNAL_ID = 'service-id-123abc'

const { req, res, call, nextRequest } = new ControllerTestBuilder('@controllers/simplified-account/settings/organisation-details/edit-organisation-details.controller')
  .withService({
    id: '123',
    externalId: SERVICE_EXTERNAL_ID,
    merchantDetails: {
      name: 'Compu-Global-Hyper-Mega-Net',
      addressLine1: '742 Evergreen Terrace',
      addressCity: 'Springfield',
      addressPostcode: 'SP21NG',
      addressCountry: 'US',
      telephoneNumber: '01234567890',
      url: 'https://www.cpghm.example.com'
    }
  })
  .withAccountType(ACCOUNT_TYPE)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@govuk-pay/pay-js-commons': { utils: { countries: { govukFrontendFormatted: () => [] } } },
    '@services/service.service': { updateService: updateServiceSpy }
  })
  .build()

describe('Controller: settings/organisation-details', () => {
  describe('get', () => {
    beforeEach(async () => {
      call('get')
    })

    it('should call the response method', () => {
      expect(mockResponse).to.have.been.calledOnce
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
        submitLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.organisationDetails.edit, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE),
        countries: [],
        backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.organisationDetails.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE)
      })
    })
  })

  describe('post', () => {
    beforeEach(async () => {
      nextRequest({
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
      expect(updateServiceSpy).to.have.been.calledOnce
      expect(updateServiceSpy).to.have.been.calledWith(SERVICE_EXTERNAL_ID, [
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

    it('should call redirect with the correct path', () => {
      expect(res.redirect).to.have.been.calledOnce
      expect(res.redirect).to.have.been.calledWith(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.organisationDetails.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE))
    })
  })
})
