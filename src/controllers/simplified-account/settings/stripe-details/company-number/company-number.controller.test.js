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
      expect(mockResponse.called).to.be.true
    })

    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse.args[0][0]).to.deep.equal(req)
      expect(mockResponse.args[0][1]).to.deep.equal(res)
      expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/stripe-details/company-number/index')
    })

    it('should pass context data to the response method', () => {
      expect(mockResponse.args[0][3]).to.have.property('backLink').to.equal(STRIPE_DETAILS_INDEX_PATH)
    })
  })

  describe('post', () => {
    const validCompanyNumbers = [
      {
        companyNumber: '01234567',
        description: 'England and Wales limited company (0 then 7 digits) number'
      },
      {
        companyNumber: 'OC123456',
        description: 'England and Wales LLP (OC then 6 digits) number'
      },
      {
        companyNumber: 'LP123456',
        description: 'England and Wales limited partnership (LP then 6 digits) number'
      },
      {
        companyNumber: 'SC123456',
        description: 'Scotland limited company (SC then 6 digits) number'
      },
      {
        companyNumber: 'SO123456',
        description: 'Scotland LLP (SO then 6 digits) number'
      },
      {
        companyNumber: 'SL123456',
        description: 'Scotland limited partnership (SL then 6 digits) number'
      },
      {
        companyNumber: 'NI123456',
        description: 'Northern Ireland limited company (NI then 6 digits) number'
      },
      {
        companyNumber: 'R0123456',
        description: 'NI pre-partition limited company (R0 then 6 digits) number'
      },
      {
        companyNumber: 'NC123456',
        description: 'NI LLP (NC then 6 digits) number'
      },
      {
        companyNumber: 'NL123456',
        description: 'NI limited partnership (NL then 6 digits)'
      }
    ]

    validCompanyNumbers.forEach(({ companyNumber, description }) => {
      describe(`when a valid ${description} is submitted`, () => {
        before(() => {
          nextRequest({
            body: {
              companyNumberDeclaration: 'yes',
              companyNumber
            }
          })
          call('post', 1)
        })

        it('should submit company number to the stripe details service', () => {
          const call = mockStripeDetailsService.updateStripeDetailsCompanyNumber.getCall(0)
          expect(call).to.not.be.null
          expect(call.args).to.deep.equal([req.service, req.account, companyNumber])
        })

        it('should redirect to the stripe details index page', () => {
          const redirect = res.redirect
          expect(redirect.calledOnce).to.be.true
          expect(redirect.args[0][0]).to.include(STRIPE_DETAILS_INDEX_PATH)
        })
      })
    })

    describe('when company number declaration is no', () => {
      before(() => {
        nextRequest({
          body: {
            companyNumberDeclaration: 'no'
          }
        })
        call('post', 1)
      })

      it('should not submit company number to the stripe details service', () => {
        const call = mockStripeDetailsService.updateStripeDetailsCompanyNumber.getCall(0)
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
      before(() => {
        nextStubs({
          '@services/stripe-details.service': {
            updateStripeDetailsCompanyNumber: sinon.stub().rejects({ type: 'StripeInvalidRequestError' })
          }
        })
        nextRequest({
          body: {
            companyNumberDeclaration: 'yes',
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
            companyNumberDeclaration: 'yes',
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
        expect(mockResponse.calledOnce).to.be.true
        expect(mockResponse.args[0][3].errors.summary[0].text).to.equal('Enter a valid Company registration number')
        expect(mockResponse.args[0][3].errors.formErrors.companyNumber).to.equal(
          'Enter a valid Company registration number'
        )
      })

      it('should restore user input', () => {
        expect(mockResponse.args[0][3]).to.have.property('companyNumberDeclaration').to.equal('yes')
        expect(mockResponse.args[0][3]).to.have.property('companyNumber').to.equal('what')
        expect(mockResponse.args[0][3]).to.have.property('backLink').to.equal(STRIPE_DETAILS_INDEX_PATH)
      })
    })

    describe('when a limited company number is entered without a leading zero', () => {
      before(() => {
        nextRequest({
          body: {
            companyNumberDeclaration: 'yes',
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

    describe('when no option is selected', () => {
      before(() => {
        nextRequest({
          body: {}
        })
        call('post', 1)
      })

      it('should render the form with validation errors', () => {
        expect(mockResponse.args[0][3].errors.summary[0].text).to.equal('Select an option')
        expect(mockResponse.args[0][3].errors.formErrors.companyNumberDeclaration).to.equal(
          'Select an option'
        )
      })
    })
  })
})
