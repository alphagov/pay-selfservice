const proxyquire = require('proxyquire')
const sinon = require('sinon')
const paths = require('../../../../../paths')
const { expect } = require('chai')
const formatSimplifiedAccountPathsFor = require('../../../../../utils/simplified-account/format/format-simplified-account-paths-for')

const ACCOUNT_TYPE = 'test'
const SERVICE_ID = 'service-id-123abc'

const STRIPE_DETAILS_INDEX_PATH = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, SERVICE_ID, ACCOUNT_TYPE)
const STRIPE_DETAILS_BANK_ACCOUNT_PATH = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.bankAccount, SERVICE_ID, ACCOUNT_TYPE)

let req, res, next, responseStub, updateStripeDetailsBankAccountStub, bankAccountController

const getController = (stubs = {}) => {
  return proxyquire('./bank-account.controller', {
    '../../../../../utils/response': { response: stubs.response },
    '../../../../../services/stripe-details.service': { updateStripeDetailsBankAccount: stubs.updateStripeDetailsBankAccount }
  })
}

const setupTest = (method, additionalStubs = {}, additionalResProps = {}, additionalReqProps = {}) => {
  responseStub = sinon.spy()
  updateStripeDetailsBankAccountStub = sinon.stub().resolves()
  bankAccountController = getController({
    response: responseStub,
    updateStripeDetailsBankAccount: updateStripeDetailsBankAccountStub,
    ...additionalStubs
  })
  res = {
    redirect: sinon.spy(),
    ...additionalResProps
  }
  req = {
    account: {
      type: ACCOUNT_TYPE
    },
    service: {
      externalId: SERVICE_ID
    },
    ...additionalReqProps
  }
  next = sinon.spy()
  bankAccountController[method](req, res, next)
}

describe('Controller: settings/stripe-details/bank-account', () => {
  describe('get', () => {
    before(() => setupTest('get'))

    it('should call the response method', () => {
      expect(responseStub.called).to.be.true // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(responseStub.args[0]).to.include(req)
      expect(responseStub.args[0]).to.include(res)
      expect(responseStub.args[0]).to.include('simplified-account/settings/stripe-details/bank-account/index')
    })

    it('should pass context data to the response method', () => {
      expect(responseStub.args[0][3]).to.have.property('backLink').to.equal(STRIPE_DETAILS_INDEX_PATH)
      expect(responseStub.args[0][3]).to.have.property('submitLink').to.equal(STRIPE_DETAILS_BANK_ACCOUNT_PATH)
    })
  })

  describe('post', () => {
    const VALID_SORT_CODE = '309430'
    const VALID_ACCOUNT_NUMBER = '00733445'
    describe('when submitting valid bank details', () => {
      before(() => setupTest('post', {}, {}, {
        body: {
          sortCodeInput: VALID_SORT_CODE,
          accountNumberInput: VALID_ACCOUNT_NUMBER
        }
      }))

      it('should submit bank details to the stripe details service', () => {
        expect(updateStripeDetailsBankAccountStub.calledWith(req.service, req.account, VALID_SORT_CODE, VALID_ACCOUNT_NUMBER)).to.be.true // eslint-disable-line
      })

      it('should redirect to the stripe details index page', () => {
        expect(res.redirect.calledOnce).to.be.true // eslint-disable-line
        expect(res.redirect.args[0][0]).to.include(STRIPE_DETAILS_INDEX_PATH)
      })
    })

    describe('when validation fails', () => {
      describe('for empty fields', () => {
        before(() => {
          setupTest('post',
            {},
            {},
            { body: { sortCodeInput: '', accountNumberInput: '' } }
          )
        })

        it('should render the form with validation errors', () => {
          expect(responseStub.calledOnce).to.be.true // eslint-disable-line
          const responseArgs = responseStub.firstCall.args
          expect(responseArgs[2]).to.equal('simplified-account/settings/stripe-details/bank-account/index')
          expect(responseArgs[3].errors.summary).to.deep.equal([
            {
              href: '#sort-code-input',
              text: 'Enter a sort code'
            },
            {
              href: '#account-number-input',
              text: 'Enter an account number'
            }
          ])
          expect(responseArgs[3].errors.formErrors.sortCodeInput).to.equal('Enter a sort code')
          expect(responseArgs[3].errors.formErrors.accountNumberInput).to.equal('Enter an account number')
        })

        it('should preserve the user input', () => {
          const responseArgs = responseStub.firstCall.args
          expect(responseArgs[3].sortCode).to.equal('')
          expect(responseArgs[3].accountNumber).to.equal('')
        })
      })

      describe('for invalid sort code format', () => {
        before(() => {
          setupTest('post',
            {},
            {},
            { body: { sortCodeInput: 'not-a-valid-sort-code', accountNumberInput: VALID_ACCOUNT_NUMBER } }
          )
        })

        it('should render the form with sort code validation error', () => {
          const expectedErrorMsg = 'Enter a valid sort code like 30-94-30 or 309430'
          expect(responseStub.calledOnce).to.be.true // eslint-disable-line
          const responseArgs = responseStub.firstCall.args
          expect(responseArgs[3].errors.summary).to.deep.equal([{
            href: '#sort-code-input',
            text: expectedErrorMsg
          }])
          expect(responseArgs[3].errors.formErrors.sortCodeInput).to.equal(expectedErrorMsg)
        })

        it('should preserve the user input', () => {
          const responseArgs = responseStub.firstCall.args
          expect(responseArgs[3].sortCode).to.equal('not-a-valid-sort-code')
          expect(responseArgs[3].accountNumber).to.equal(VALID_ACCOUNT_NUMBER)
        })
      })

      describe('for invalid account number format', () => {
        before(() => {
          setupTest('post',
            {},
            {},
            { body: { sortCodeInput: VALID_SORT_CODE, accountNumberInput: 'not-a-valid-account-number' } }
          )
        })

        it('should render the form with account number validation error', () => {
          const expectedErrorMsg = 'Enter a valid account number like 00733445'
          expect(responseStub.calledOnce).to.be.true // eslint-disable-line
          const responseArgs = responseStub.firstCall.args
          expect(responseArgs[3].errors.summary).to.deep.equal([{
            href: '#account-number-input',
            text: expectedErrorMsg
          }])
          expect(responseArgs[3].errors.formErrors.accountNumberInput).to.equal(expectedErrorMsg)
        })

        it('should preserve the user input', () => {
          const responseArgs = responseStub.firstCall.args
          expect(responseArgs[3].sortCode).to.equal(VALID_SORT_CODE)
          expect(responseArgs[3].accountNumber).to.equal('not-a-valid-account-number')
        })
      })
    })

    describe('when Stripe API returns errors', () => {
      describe('for unusable bank account', () => {
        before(() => {
          setupTest('post',
            { updateStripeDetailsBankAccount: sinon.stub().rejects({ code: 'bank_account_unusable' }) },
            {},
            { body: { sortCodeInput: VALID_SORT_CODE, accountNumberInput: VALID_ACCOUNT_NUMBER } }
          )
        })

        it('should render the form with appropriate error message', () => {
          expect(responseStub.calledOnce).to.be.true // eslint-disable-line
          const responseArgs = responseStub.firstCall.args
          expect(responseArgs[3].errors.summary[0].text).to.equal(
            'The bank account provided cannot be used. Contact GOV.UK Pay for assistance.'
          )
        })
      })

      describe('for invalid sort code', () => {
        before(() => {
          setupTest('post',
            { updateStripeDetailsBankAccount: sinon.stub().rejects({ code: 'routing_number_invalid' }) },
            {},
            { body: { sortCodeInput: VALID_SORT_CODE, accountNumberInput: VALID_ACCOUNT_NUMBER } }
          )
        })

        it('should render the form with sort code error', () => {
          expect(responseStub.calledOnce).to.be.true // eslint-disable-line
          const responseArgs = responseStub.firstCall.args
          expect(responseArgs[3].errors.summary[0].text).to.equal('Invalid sort code')
          expect(responseArgs[3].errors.formErrors.sortCodeInput).to.equal(
            'The sort code provided is invalid'
          )
        })
      })

      describe('for invalid account number', () => {
        before(() => {
          setupTest('post',
            { updateStripeDetailsBankAccount: sinon.stub().rejects({ code: 'account_number_invalid' }) },
            {},
            { body: { sortCodeInput: VALID_SORT_CODE, accountNumberInput: VALID_ACCOUNT_NUMBER } }
          )
        })

        it('should render the form with account number error', () => {
          expect(responseStub.calledOnce).to.be.true // eslint-disable-line
          const responseArgs = responseStub.firstCall.args
          expect(responseArgs[3].errors.summary[0].text).to.equal('Invalid account number')
          expect(responseArgs[3].errors.formErrors.accountNumberInput).to.equal(
            'The account number provided is invalid'
          )
        })
      })

      describe('for unhandled errors with codes', () => {
        before(() => {
          setupTest('post',
            { updateStripeDetailsBankAccount: sinon.stub().rejects({ code: 'unhandled_error' }) },
            {},
            { body: { sortCodeInput: VALID_SORT_CODE, accountNumberInput: VALID_ACCOUNT_NUMBER } }
          )
        })

        it('should pass the error to next middleware', () => {
          expect(next.calledOnce).to.be.true // eslint-disable-line
          expect(next.firstCall.args[0].code).to.equal('unhandled_error')
        })
      })

      describe('for any other errors', () => {
        before(() => {
          setupTest('post',
            { updateStripeDetailsBankAccount: sinon.stub().rejects({ foo: 'bar' }) },
            {},
            { body: { sortCodeInput: VALID_SORT_CODE, accountNumberInput: VALID_ACCOUNT_NUMBER } }
          )
        })

        it('should pass the error to next middleware', () => {
          expect(next.calledOnce).to.be.true // eslint-disable-line
          expect(next.firstCall.args[0].foo).to.equal('bar')
        })
      })
    })
  })
})
