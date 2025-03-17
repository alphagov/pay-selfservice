const sinon = require('sinon')
const { expect } = require('chai')
const formatSimplifiedAccountPathsFor = require('../../../../../utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const Service = require('@models/service/Service.class')

const mockResponse = sinon.spy()
const mockStripeDetailsService = {
  updateStripeDetailsOrganisationNameAndAddress: sinon.stub().resolves()
}
const mockCommonsUtils = {
  countries: {
    govukFrontendFormatted: sinon.stub().returns([{
      value: 'CS',
      text: 'Calisota'
    }])
  }
}

const ACCOUNT_TYPE = 'live'
const SERVICE_ID = 'service-id-123abc'
const STRIPE_DETAILS_INDEX_PATH = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, SERVICE_ID, ACCOUNT_TYPE)
const STRIPE_DETAILS_ORG_DETAILS_INDEX_PATH = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.organisationDetails.index, SERVICE_ID, ACCOUNT_TYPE)

const {
  res,
  nextRequest,
  call
} = new ControllerTestBuilder('@controllers/simplified-account/settings/stripe-details/organisation-details/organisation-details-update.controller')
  .withService(new Service({
    external_id: SERVICE_ID,
    merchant_details: {
      name: 'McDuck Enterprises',
      address_line1: 'McDuck Manor',
      address_city: 'Duckburg'
    }
  }))
  .withAccount({ type: ACCOUNT_TYPE })
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/stripe-details.service': mockStripeDetailsService,
    '@govuk-pay/pay-js-commons': { utils: mockCommonsUtils }
  })
  .build()

describe('Controller: settings/stripe-details/organisation-details-update', () => {
  describe('get', () => {
    before(() => {
      call('get', 1)
    })

    it('should call the response method with correct arguments', () => {
      expect(mockResponse).to.have.been.calledWith(
        sinon.match.any,
        sinon.match.any,
        'simplified-account/settings/stripe-details/organisation-details/update-organisation-details', {
          backLink: STRIPE_DETAILS_ORG_DETAILS_INDEX_PATH,
          countries: [{ value: 'CS', text: 'Calisota' }],
          organisationDetails: {
            organisationName: 'McDuck Enterprises',
            addressLine1: 'McDuck Manor',
            addressLine2: '',
            addressCity: 'Duckburg',
            addressPostcode: undefined,
            addressCountry: undefined
          }
        })
    })
  })

  describe('post', () => {
    describe('when submitting valid details', () => {
      before(() => {
        nextRequest({
          body: {
            organisationName: 'Glomgold Industries',
            addressLine1: 'McDuck Manor',
            addressCity: 'Duckburg',
            addressPostcode: 'SW1A 1AA',
            addressCountry: 'CS'
          }
        })
        call('post', 1)
      })

      it('should submit organisation details to the stripe details service', () => {
        expect(mockStripeDetailsService.updateStripeDetailsOrganisationNameAndAddress).to.have.been.calledWith(
          sinon.match.any,
          sinon.match.any,
          {
            name: 'Glomgold Industries',
            address_line1: 'McDuck Manor',
            address_city: 'Duckburg',
            address_postcode: 'SW1A 1AA',
            address_country: 'CS'
          })
      })

      it('should redirect to the stripe details index page', () => {
        expect(res.redirect).to.have.been.calledOnce // eslint-disable-line no-unused-expressions
        expect(res.redirect).to.have.been.calledWith(STRIPE_DETAILS_INDEX_PATH)
      })
    })

    describe('when submitting invalid details', () => {
      before(() => {
        nextRequest({
          body: {
            organisationName: '',
            addressLine1: 'McDuck Manor',
            addressCity: 'Duckburg',
            addressPostcode: '',
            addressCountry: 'CS'
          }
        })
        call('post', 1)
      })

      it('should not submit organisation details to the stripe details service', () => {
        expect(mockStripeDetailsService.updateStripeDetailsOrganisationNameAndAddress).to.not.have.been.called // eslint-disable-line
      })

      it('should not redirect', () => {
        expect(res.redirect).to.not.have.been.called // eslint-disable-line
      })

      it('should pass context data to the response method with errors', () => {
        expect(mockResponse).to.have.been.calledWith(
          sinon.match.any,
          sinon.match.any,
          'simplified-account/settings/stripe-details/organisation-details/update-organisation-details', {
            errors: {
              summary: [
                {
                  text: 'Enter an organisation name',
                  href: '#organisation-name'
                },
                {
                  text: 'Enter a postcode',
                  href: '#address-postcode'
                }
              ],
              formErrors: {
                organisationName: 'Enter an organisation name',
                addressPostcode: 'Enter a postcode'
              }
            },
            backLink: STRIPE_DETAILS_ORG_DETAILS_INDEX_PATH,
            organisationDetails: {
              organisationName: '',
              addressLine1: 'McDuck Manor',
              addressLine2: '',
              addressCity: 'Duckburg',
              addressPostcode: '',
              addressCountry: 'CS'
            },
            countries: [{ value: 'CS', text: 'Calisota' }]
          })
      })
    })

    describe('when address line 2 is present', () => {
      before(() => {
        nextRequest({
          body: {
            organisationName: 'McDuck Enterprises',
            addressLine1: 'McDuck Manor',
            addressLine2: 'The Money Bin',
            addressCity: 'Duckburg',
            addressPostcode: 'SW1A 1AA',
            addressCountry: 'CS'
          }
        })
        call('post', 1)
      })

      it('should include additional details when submitting data to stripe details service', () => {
        expect(mockStripeDetailsService.updateStripeDetailsOrganisationNameAndAddress).to.have.been.calledWith(
          sinon.match.any,
          sinon.match.any,
          {
            name: 'McDuck Enterprises',
            address_line1: 'McDuck Manor',
            address_line2: 'The Money Bin',
            address_city: 'Duckburg',
            address_postcode: 'SW1A 1AA',
            address_country: 'CS'
          })
      })
    })
  })
})
