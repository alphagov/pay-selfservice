import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { expect } from 'chai'

const mockResponse = sinon.stub()
const updateServiceStub = sinon.stub()

const ACCOUNT_TYPE = 'live'
const SERVICE_EXTERNAL_ID = 'service-id-123abc'

const { req, res, call, nextRequest } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/organisation-details/edit-organisation-details.controller'
)
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
      url: 'https://www.cpghm.example.com',
    },
  })
  .withAccountType(ACCOUNT_TYPE)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@govuk-pay/pay-js-commons': { utils: { countries: { govukFrontendFormatted: () => [] } } },
    '@services/service.service': { updateService: updateServiceStub },
  })
  .build()

describe('Controller: settings/organisation-details', () => {
  describe('get', () => {
    beforeEach(async () => {
      await call('get')
    })

    it('should call the response method', () => {
      expect(mockResponse).to.have.been.calledOnce
    })

    it('should call the response method with req, res, and template path', () => {
      expect(mockResponse).to.have.been.calledWith(
        req,
        res,
        'simplified-account/settings/organisation-details/edit-organisation-details'
      )
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
          organisationUrl: 'https://www.cpghm.example.com',
        },
        submitLink: formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.organisationDetails.edit,
          SERVICE_EXTERNAL_ID,
          ACCOUNT_TYPE
        ),
        countries: [],
        backLink: formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.organisationDetails.index,
          SERVICE_EXTERNAL_ID,
          ACCOUNT_TYPE
        ),
      })
    })
  })

  describe('post', () => {
    beforeEach(() => {
      nextRequest({
        body: {
          organisationName: 'Flancrest Enterprises',
          addressLine1: '744 Evergreen Terrace',
          addressLine2: '',
          addressCity: 'Springfield',
          addressPostcode: 'SP21NG',
          addressCountry: 'US',
          telephoneNumber: '+44 0808 157 0192',
          organisationUrl: 'https://www.flancrest.example.com',
        },
      })
    })

    it('should call the updateService method with the correct PATCH request', async () => {
      await call('post')

      expect(updateServiceStub).to.have.been.calledOnce
      expect(updateServiceStub).to.have.been.calledWith(SERVICE_EXTERNAL_ID, [
        {
          op: 'replace',
          value: 'Flancrest Enterprises',
          path: 'merchant_details/name',
        },
        {
          op: 'replace',
          value: '744 Evergreen Terrace',
          path: 'merchant_details/address_line1',
        },
        {
          op: 'replace',
          value: '',
          path: 'merchant_details/address_line2',
        },
        {
          op: 'replace',
          value: 'Springfield',
          path: 'merchant_details/address_city',
        },
        {
          op: 'replace',
          value: 'SP21NG',
          path: 'merchant_details/address_postcode',
        },
        {
          op: 'replace',
          value: 'US',
          path: 'merchant_details/address_country',
        },
        {
          op: 'replace',
          value: '+44 0808 157 0192',
          path: 'merchant_details/telephone_number',
        },
        {
          op: 'replace',
          value: 'https://www.flancrest.example.com',
          path: 'merchant_details/url',
        },
      ])
    })

    it('should call redirect with the correct path', async () => {
      await call('post')

      expect(res.redirect).to.have.been.calledOnce
      expect(res.redirect).to.have.been.calledWith(
        formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.organisationDetails.index,
          SERVICE_EXTERNAL_ID,
          ACCOUNT_TYPE
        )
      )
    })
  })
})
