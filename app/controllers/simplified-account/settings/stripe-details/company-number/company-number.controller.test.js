const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const sinon = require('sinon')
const { expect } = require('chai')

const mockResponse = sinon.spy()
const mockStripeDetailsService = {
  updateStripeDetailsCompanyNumber: sinon.stub().resolves()
}

const ACCOUNT_TYPE = 'live'
const SERVICE_ID = 'service-id-123abc'
const STRIPE_DETAILS_INDEX_PATH = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, SERVICE_ID, ACCOUNT_TYPE)

const {
  req,
  res,
  nextRequest,
  nextStubs,
  call
} = new ControllerTestBuilder('@controllers/simplified-account/settings/stripe-details/company-number/company-number.controller')
  .withServiceExternalId(SERVICE_ID)
  .withAccountType(ACCOUNT_TYPE)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/stripe-details.service': mockStripeDetailsService
  })
  .build()

describe('Controller: settings/stripe-details/company-number', () => {
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
      expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/stripe-details/company-number/index')
    })

    it('should pass context data to the response method', () => {
      expect(mockResponse.args[0][3]).to.have.property('companyNumberDeclaration').to.equal(true)
      expect(mockResponse.args[0][3]).to.have.property('backLink').to.equal(STRIPE_DETAILS_INDEX_PATH)
    })
  })

  describe('post', () => {
    describe('when a valid company number is submitted', () => {
      before(() => {
        nextRequest({
          body: {
            companyNumberDeclaration: 'true',
            companyNumber: '01234567'
          }
        })
        call('post', 1)
      })

      it('should submit company number to the stripe details service', () => {
        const call = mockStripeDetailsService.updateStripeDetailsCompanyNumber.getCall(0)
        expect(call).to.not.be.null // eslint-disable-line
        expect(call.args).to.deep.equal([req.service, req.account, '01234567'])
      })

      it('should redirect to the stripe details index page', () => {
        const redirect = res.redirect
        expect(redirect.calledOnce).to.be.true // eslint-disable-line
        expect(redirect.args[0][0]).to.include(STRIPE_DETAILS_INDEX_PATH)
      })
    })

    describe('when company number declaration is false', () => {
      before(() => {
        nextRequest({
          body: {
            companyNumberDeclaration: 'false'
          }
        })
        call('post', 1)
      })

      it('should not submit company number to the stripe details service', () => {
        const call = mockStripeDetailsService.updateStripeDetailsCompanyNumber.getCall(0)
        expect(call).to.not.be.null // eslint-disable-line
        expect(call.args).to.deep.equal([req.service, req.account, false])
      })

      it('should redirect to the stripe details index page', () => {
        const redirect = res.redirect
        expect(redirect.calledOnce).to.be.true // eslint-disable-line
        expect(redirect.args[0][0]).to.include(STRIPE_DETAILS_INDEX_PATH)
      })
    })

    describe('when the Stripe API returns an error', () => {
      before(() => {
        nextStubs({
          '@services/stripe-details.service': {
            updateStripeDetailsCompanyNumber: sinon.stub().rejects({ type: 'StripeInvalidRequestError' })
          }
        })
        nextRequest({
          body: {
            companyNumberDeclaration: 'true',
            companyNumber: '01234567'
          }
        })
        call('post', 1)
      })

      it('should render the form with appropriate error response', () => {
        expect(mockResponse.args[0][3].errors.summary[0].text).to.equal('There is a problem with your Company number. Please check your answer and try again.')
      })
    })

    describe('when company number validation fails', () => {
      before(() => {
        nextRequest({
          body: {
            companyNumberDeclaration: 'true',
            companyNumber: 'what'
          }
        })
        call('post', 1)
      })

      it('should not call the stripe details service', () => {
        sinon.assert.notCalled(mockStripeDetailsService.updateStripeDetailsCompanyNumber)
      })

      it('should not redirect to the stripe details index page', () => {
        sinon.assert.notCalled(res.redirect)
      })

      it('should render the form with validation errors', () => {
        expect(mockResponse.calledOnce).to.be.true // eslint-disable-line
        expect(mockResponse.args[0][3].errors.summary[0].text).to.equal('Enter a valid Company registration number')
        expect(mockResponse.args[0][3].errors.formErrors.companyNumber).to.equal(
          'Enter a valid Company registration number'
        )
      })

      it('should restore user input', () => {
        expect(mockResponse.args[0][3]).to.have.property('companyNumberDeclaration').to.equal(true)
        expect(mockResponse.args[0][3]).to.have.property('companyNumber').to.equal('what')
        expect(mockResponse.args[0][3]).to.have.property('backLink').to.equal(STRIPE_DETAILS_INDEX_PATH)
      })
    })

    describe('when a limited company number is entered without a leading zero', () => {
      before(() => {
        nextRequest({
          body: {
            companyNumberDeclaration: 'true',
            companyNumber: '1234567'
          }
        })
        call('post', 1)
      })

      it('should render the form with validation errors', () => {
        expect(mockResponse.args[0][3].errors.summary[0].text).to.equal('Limited Company numbers in England and Wales have 8 digits and always start with 0')
        expect(mockResponse.args[0][3].errors.formErrors.companyNumber).to.equal(
          'Limited Company numbers in England and Wales have 8 digits and always start with 0'
        )
      })
    })
  })
})
