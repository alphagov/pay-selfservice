const sinon = require('sinon')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const { GOV_ENTITY_DOC_FORM_FIELD_NAME } = require('@controllers/simplified-account/settings/stripe-details/government-entity-document/constants')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const { expect } = require('chai')
const paths = require('@root/paths')

const mockResponse = sinon.spy()
const mockStripeDetailsService = {
  updateStripeDetailsUploadEntityDocument: sinon.stub().resolves()
}

const ACCOUNT_TYPE = 'live'
const SERVICE_ID = 'service-id-123abc'
const STRIPE_DETAILS_INDEX_PATH = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, SERVICE_ID, ACCOUNT_TYPE)

const { req, res, call } = new ControllerTestBuilder('@controllers/simplified-account/settings/stripe-details/government-entity-document/government-entity-document.controller')
  .withServiceExternalId(SERVICE_ID)
  .withAccountType(ACCOUNT_TYPE)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/stripe-details.service': mockStripeDetailsService
  })
  .build()

describe('Controller: settings/stripe-details/government-entity-document', () => {
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
      expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/stripe-details/government-entity-document/index')
    })

    it('should pass context data to the response method', () => {
      expect(mockResponse.args[0][3]).to.have.property('backLink').to.equal(STRIPE_DETAILS_INDEX_PATH)
      expect(mockResponse.args[0][3]).to.have.property('uploadField').to.equal(GOV_ENTITY_DOC_FORM_FIELD_NAME)
    })
  })
})
