const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const sinon = require('sinon')
const { expect } = require('chai')

const mockResponse = sinon.spy()
const mockStripeDetailsService = {
  updateConnectorStripeProgress: sinon.stub().resolves()
}

const ACCOUNT_TYPE = 'live'
const SERVICE_ID = 'service-id-123abc'
const STRIPE_DETAILS_INDEX_PATH = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, SERVICE_ID, ACCOUNT_TYPE)
const STRIPE_DETAILS_UPDATE_ORG_PATH = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.organisationDetails.update, SERVICE_ID, ACCOUNT_TYPE)

const { req, res, nextRequest, call } = new ControllerTestBuilder('@controllers/simplified-account/settings/stripe-details/organisation-details/organisation-details.controller')
  .withService({
    externalId: SERVICE_ID,
    merchantDetails: {
      name: 'McDuck Enterprises',
      addressLine1: 'McDuck Manor',
      addressCity: 'Duckburg'
    }
  })
  .withAccount({ type: ACCOUNT_TYPE })
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/stripe-details.service': mockStripeDetailsService
  })
  .build()

describe('Controller: settings/stripe-details/organisation-details', () => {
  describe('get', () => {
    before(() => {
      call('get', 1)
    })

    it('should call the response method', () => {
      expect(mockResponse.called).to.be.true
    })

    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse.args[0][0]).to.deep.equal(req)
      expect(mockResponse.args[0][1]).to.deep.equal(res)
      expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/stripe-details/organisation-details/index')
    })

    it('should pass context data to the response method', () => {
      expect(mockResponse.args[0][3]).to.have.property('backLink').to.equal(STRIPE_DETAILS_INDEX_PATH)
      expect(mockResponse.args[0][3]).to.have.property('organisationName').to.equal('McDuck Enterprises')
      expect(mockResponse.args[0][3]).to.have.property('organisationAddress').to.equal('McDuck Manor<br>Duckburg')
    })
  })

  describe('post', () => {
    describe('when user selects yes', () => {
      before(() => {
        nextRequest({
          body: {
            confirmOrgDetails: 'true'
          }
        })
        call('post', 1)
      })

      it('should update progress in connector database', () => {
        const call = mockStripeDetailsService.updateConnectorStripeProgress.getCall(0)
        expect(call).to.not.be.null // eslint-disable-line
        expect(call.args).to.deep.equal([req.service, req.account, 'organisation_details'])
      })

      it('should redirect to the stripe details index page', () => {
        const call = res.redirect.getCall(0)
        expect(call).to.not.be.null // eslint-disable-line
        expect(call.args).to.deep.equal([STRIPE_DETAILS_INDEX_PATH])
      })
    })

    describe('when user selects no', () => {
      before(() => {
        nextRequest({
          body: {
            confirmOrgDetails: 'false'
          }
        })
        call('post', 1)
      })

      it('should not update progress in connector database', () => {
        const call = mockStripeDetailsService.updateConnectorStripeProgress.getCall(0)
        expect(call).to.be.null // eslint-disable-line
      })

      it('should redirect to the update organisation details page', () => {
        const call = res.redirect.getCall(0)
        expect(call).to.not.be.null // eslint-disable-line
        expect(call.args).to.deep.equal([STRIPE_DETAILS_UPDATE_ORG_PATH])
      })
    })

    describe('when user does not select an option', () => {
      before(() => {
        nextRequest({
          body: {
            confirmOrgDetails: undefined
          }
        })
        call('post', 1)
      })

      it('should not redirect', () => {
        expect(res.redirect.called).to.be.false // eslint-disable-line
      })

      it('should not update progress in connector database', () => {
        const call = mockStripeDetailsService.updateConnectorStripeProgress.getCall(0)
        expect(call).to.be.null // eslint-disable-line
      })

      it('should pass context data to the response method with errors', () => {
        expect(mockResponse.args[0][3]).to.have.property('backLink').to.equal(STRIPE_DETAILS_INDEX_PATH)
        expect(mockResponse.args[0][3]).to.have.property('organisationName').to.equal('McDuck Enterprises')
        expect(mockResponse.args[0][3]).to.have.property('organisationAddress').to.equal('McDuck Manor<br>Duckburg')
        const formErrors = mockResponse.args[0][3].errors.formErrors
        expect(Object.keys(formErrors).length).to.equal(1)
        expect(formErrors).to.deep.include(
          {
            confirmOrgDetails: 'Select yes if your organisation’s details match the details on your government entity document'
          }
        )
        const errorSummary = mockResponse.args[0][3].errors.summary
        expect(errorSummary.length).to.equal(1)
        expect(errorSummary).to.deep.include(
          {
            href: '#confirm-org-details',
            text: 'Select yes if your organisation’s details match the details on your government entity document'
          }
        )
      })
    })
  })
})
