const sinon = require('sinon')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const { expect } = require('chai')

const mockResponse = sinon.spy()
const mockStripeDetailsService = {
  updateStripeDetailsVatNumber: sinon.stub().resolves()
}

const ACCOUNT_TYPE = 'live'
const SERVICE_ID = 'service-id-123abc'
const STRIPE_DETAILS_INDEX_PATH = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, SERVICE_ID, ACCOUNT_TYPE)

const { req, res, call } = new ControllerTestBuilder('@controllers/simplified-account/settings/stripe-details/vat-number/vat-number.controller')
  .withServiceExternalId(SERVICE_ID)
  .withAccountType(ACCOUNT_TYPE)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/stripe-details.service': mockStripeDetailsService
  })
  .build()

describe('Controller: settings/stripe-details/vat-number', () => {
  describe('get', () => {
    before(() => {
      call('get', 1)
    })

    it('should call the response method', () => {
      expect(mockResponse.called).to.be.true // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse.args[0][0]).to.deep.equal(req)
      expect(mockResponse.args[0][1]).to.deep.equal(res)
      expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/stripe-details/vat-number/index')
    })

    it('should pass context data to the response method', () => {
      expect(mockResponse.args[0][3]).to.have.property('vatNumberDeclaration').to.equal(true)
      expect(mockResponse.args[0][3]).to.have.property('backLink').to.equal(STRIPE_DETAILS_INDEX_PATH)
    })
  })
})
