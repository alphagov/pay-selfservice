const sinon = require('sinon')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const { expect } = require('chai')

const mockResponse = sinon.spy()
const mockStripeDetailsService = {
  updateStripeDetailsDirector: sinon.stub().resolves()
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
} = new ControllerTestBuilder('@controllers/simplified-account/settings/stripe-details/director/director.controller')
  .withServiceExternalId(SERVICE_ID)
  .withAccountType(ACCOUNT_TYPE)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/stripe-details.service': mockStripeDetailsService
  })
  .build()

describe('Controller: settings/stripe-details/director', () => {
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
      expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/stripe-details/director/index')
    })

    it('should pass context data to the response method', () => {
      expect(mockResponse.args[0][3]).to.have.property('backLink').to.equal(STRIPE_DETAILS_INDEX_PATH)
    })
  })

  describe('post', () => {
    describe('when submitting valid data', () => {
      before(() => {
        nextRequest({
          body: {
            firstName: 'Scrooge',
            lastName: 'McDuck',
            dobDay: '01',
            dobMonth: '01',
            dobYear: '1901',
            workEmail: 'scrooge.mcduck@pay.gov.uk'
          }
        })
        call('post', 1)
      })
      it('should submit director details to the stripe details service', () => {
        expect(mockStripeDetailsService.updateStripeDetailsDirector).to.have.been.calledWith(
          sinon.match.any,
          sinon.match.any,
          {
            first_name: 'Scrooge',
            last_name: 'McDuck',
            dob_day: 1,
            dob_month: 1,
            dob_year: 1901,
            email: 'scrooge.mcduck@pay.gov.uk'
          })
      })
      it('should redirect to the stripe details index', () => {
        const redirect = res.redirect
        expect(redirect.calledOnce).to.be.true // eslint-disable-line
        expect(redirect.args[0][0]).to.include(STRIPE_DETAILS_INDEX_PATH)
      })
    })

    describe('when submitting invalid data', () => {
      before(() => {
        nextRequest({
          body: {
            firstName: '',
            lastName: '',
            dobDay: '01',
            dobMonth: '01',
            dobYear: '1899',
            workEmail: 'scrooge.mcduck'
          }
        })
        call('post', 1)
      })

      it('should not submit director details to the stripe details service', () => {
        expect(mockStripeDetailsService.updateStripeDetailsDirector).to.not.have.been.called // eslint-disable-line
      })
      it('should not redirect to the stripe details index', () => {
        expect(res.redirect).to.not.have.been.called // eslint-disable-line
      })
      it('should render the form with validation errors', () => {
        expect(mockResponse).to.have.been.calledWith(
          sinon.match.any,
          sinon.match.any,
          'simplified-account/settings/stripe-details/director/index',
          {
            errors: {
              summary: [
                { text: 'Enter the first name', href: '#first-name' },
                { text: 'Enter the last name', href: '#last-name' },
                { text: 'Enter a valid year of birth', href: '#dob-year' },
                { text: 'Enter a real email address', href: '#work-email' }
              ],
              formErrors: {
                firstName: 'Enter the first name',
                lastName: 'Enter the last name',
                dobYear: 'Enter a valid year of birth',
                workEmail: 'Enter a real email address'
              }
            },
            name: { firstName: '', lastName: '' },
            dob: { dobDay: '01', dobMonth: '01', dobYear: '1899' },
            workEmail: 'scrooge.mcduck',
            backLink: STRIPE_DETAILS_INDEX_PATH
          })
      })
    })
    describe('when the Stripe API returns an error', () => {
      before(() => {
        nextStubs({
          '@services/stripe-details.service': {
            updateStripeDetailsDirector: sinon.stub().rejects({ type: 'StripeInvalidRequestError' })
          }
        })
        nextRequest({
          body: {
            firstName: 'Scrooge',
            lastName: 'McDuck',
            dobDay: '01',
            dobMonth: '01',
            dobYear: '1901',
            workEmail: 'scrooge.mcduck@pay.gov.uk'
          }
        })
        call('post', 1)
      })

      it('should render the form with appropriate error response', () => {
        expect(mockResponse).to.have.been.calledWith(
          sinon.match.any,
          sinon.match.any,
          'simplified-account/settings/stripe-details/director/index',
          {
            errors: {
              summary: [
                { text: 'There is a problem with the information you\'ve submitted. We\'ve not been able to save your details. Email govuk-pay-support@digital.cabinet-office.gov.uk for help.' }
              ]
            },
            name: { firstName: 'Scrooge', lastName: 'McDuck' },
            dob: { dobDay: '01', dobMonth: '01', dobYear: '1901' },
            workEmail: 'scrooge.mcduck@pay.gov.uk',
            backLink: STRIPE_DETAILS_INDEX_PATH
          })
      })
    })
  })
})
