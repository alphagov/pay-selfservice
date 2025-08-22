const sinon = require('sinon')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const { expect } = require('chai')

const mockResponse = sinon.stub()
const mockStripeDetailsService = {
  updateStripeDetailsVatNumber: sinon.stub().resolves()
}

const ACCOUNT_TYPE = 'live'
const SERVICE_ID = 'service-id-123abc'
const STRIPE_DETAILS_INDEX_PATH = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, SERVICE_ID, ACCOUNT_TYPE)

const { req, res, nextRequest, nextStubs, call } = new ControllerTestBuilder('@controllers/simplified-account/settings/stripe-details/vat-number/vat-number.controller')
  .withServiceExternalId(SERVICE_ID)
  .withAccountType(ACCOUNT_TYPE)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/stripe-details.service': mockStripeDetailsService
  })
  .build()

describe('Controller: settings/stripe-details/vat-number', () => {
  describe('get', () => {
    it('should call the response method',  async () => {
      await call('get', 1)
      expect(mockResponse.called).to.be.true
    })

    it('should pass req, res and template path to the response method', async () => {
      await call('get', 1)
      expect(mockResponse.args[0][0]).to.deep.equal(req)
      expect(mockResponse.args[0][1]).to.deep.equal(res)
      expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/stripe-details/vat-number/index')
    })

    it('should pass context data to the response method', async () => {
      await call('get', 1)
      expect(mockResponse.args[0][3]).to.have.property('backLink').to.equal(STRIPE_DETAILS_INDEX_PATH)
    })
  })

  describe('post', () => {
    const validVATNumbers = [
      {
        vatNumber: 'GB123456789',
        description: 'standard VAT number'
      },
      {
        vatNumber: '123456789',
        description: 'standard VAT number (no prefix)'
      },
      {
        vatNumber: 'GB123456789123',
        description: 'branch trader VAT number'
      },
      {
        vatNumber: 'GBGD001',
        description: 'government department VAT number'
      },
      {
        vatNumber: 'GBHA599',
        description: 'health authority VAT number'
      }
    ]

    validVATNumbers.forEach(({ vatNumber, description }) => {
      describe(`when a valid ${description} is submitted`, () => {
        beforeEach(async () => {
          nextRequest({
            body: {
              vatNumberDeclaration: 'yes',
              vatNumber
            }
          })
          await call('post', 1)
        })

        it('should submit vat number to the stripe details service', () => {
          const call = mockStripeDetailsService.updateStripeDetailsVatNumber.getCall(0)
          expect(call).to.not.be.null
          expect(call.args).to.deep.equal([req.service, req.account, vatNumber])
        })

        it('should redirect to the stripe details index page', () => {
          const redirect = res.redirect
          expect(redirect.calledOnce).to.be.true
          expect(redirect.args[0][0]).to.include(STRIPE_DETAILS_INDEX_PATH)
        })
      })
    })

    describe('when VAT number declaration is no', () => {
      beforeEach(async () => {
        nextRequest({
          body: {
            vatNumberDeclaration: 'no'
          }
        })
        await call('post', 1)
      })

      it('should not submit VAT number to the stripe details service', () => {
        const call = mockStripeDetailsService.updateStripeDetailsVatNumber.getCall(0)
        expect(call).to.not.be.null
        expect(call.args).to.deep.equal([req.service, req.account, false])
      })

      it('should redirect to the stripe details index page', () => {
        const redirect = res.redirect
        expect(redirect.calledOnce).to.be.true
        expect(redirect.args[0][0]).to.include(STRIPE_DETAILS_INDEX_PATH)
      })
    })

    describe('when the Stripe API returns an error', () => {
      beforeEach(async () => {
        nextStubs({
          '@services/stripe-details.service': {
            updateStripeDetailsVatNumber: sinon.stub().rejects({ type: 'StripeInvalidRequestError' })
          }
        })
        nextRequest({
          body: {
            vatNumberDeclaration: 'yes',
            vatNumber: 'GB123456789'
          }
        })
        await call('post', 1)
      })

      it('should render the form with appropriate error response', () => {
        expect(mockResponse.args[0][3].errors.summary[0].text).to.equal('There is a problem with your VAT number. Please check your answer and try again.')
      })
    })

    describe('when VAT number validation fails', () => {
      beforeEach(async () => {
        nextRequest({
          body: {
            vatNumberDeclaration: 'yes',
            vatNumber: 'what'
          }
        })
        await call('post', 1)
      })

      it('should not call the stripe details service', () => {
        sinon.assert.notCalled(mockStripeDetailsService.updateStripeDetailsVatNumber)
      })

      it('should not redirect to the stripe details index page', () => {
        sinon.assert.notCalled(res.redirect)
      })

      it('should render the form with validation errors', () => {
        expect(mockResponse.calledOnce).to.be.true
        expect(mockResponse.args[0][3].errors.summary[0].text).to.equal('Enter a valid VAT registration number')
        expect(mockResponse.args[0][3].errors.formErrors.vatNumber).to.equal(
          'Enter a valid VAT registration number'
        )
      })

      it('should restore user input', () => {
        expect(mockResponse.args[0][3]).to.have.property('vatNumberDeclaration').to.equal('yes')
        expect(mockResponse.args[0][3]).to.have.property('vatNumber').to.equal('what')
        expect(mockResponse.args[0][3]).to.have.property('backLink').to.equal(STRIPE_DETAILS_INDEX_PATH)
      })
    })
  })
})
