const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const _ = require('lodash')
const { expect } = require('chai')
const { FORM_STATE_KEY } = require('@controllers/simplified-account/settings/stripe-details/responsible-person/constants')

const ACCOUNT_TYPE = 'live'
const SERVICE_ID = 'service-id-123abc'

const STRIPE_DETAILS_INDEX_PATH = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, SERVICE_ID, ACCOUNT_TYPE)
const RESPONSIBLE_PERSON_ADDRESS_PATH = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.homeAddress, SERVICE_ID, ACCOUNT_TYPE)

let req, res, next, responseStub, responsiblePersonController

const getController = (stubs = {}) => {
  return proxyquire('./responsible-person.controller', {
    '@utils/response': { response: stubs.response }
  })
}

const setupTest = (method, additionalStubs = {}, additionalResProps = {}, additionalReqProps = {}) => {
  responseStub = sinon.spy()
  responsiblePersonController = getController({
    response: responseStub,
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
  responsiblePersonController[method][1](req, res, next)
}

describe('Controller: settings/stripe-details/responsible-person', () => {
  describe('get', () => {
    describe('no existing form state', () => {
      before(() => setupTest('get'))

      it('should call the response method', () => {
        expect(responseStub.called).to.be.true
      })

      it('should pass req, res and template path to the response method', () => {
        expect(responseStub.args[0]).to.include(req)
        expect(responseStub.args[0]).to.include(res)
        expect(responseStub.args[0]).to.include('simplified-account/settings/stripe-details/responsible-person/index')
      })

      it('should pass context data to the response method', () => {
        expect(responseStub.args[0][3]).to.have.property('backLink').to.equal(STRIPE_DETAILS_INDEX_PATH)
        expect(responseStub.args[0][3]).to.have.property('name').to.be.undefined
        expect(responseStub.args[0][3]).to.have.property('dob').to.be.undefined
      })
    })
    describe('existing form state', () => {
      const existingName = {
        firstName: 'Scrooge',
        lastName: 'McDuck'
      }
      const existingDob = {
        dobDay: '18',
        dobMonth: '09',
        dobYear: '1940'
      }
      before(() => setupTest('get', {}, {}, {
        session: {
          formState: {
            responsiblePerson: {
              name: existingName,
              dob: existingDob
            }
          }
        }
      }))

      it('should pass context data to the response method', () => {
        expect(responseStub.args[0][3]).to.have.property('backLink').to.equal(STRIPE_DETAILS_INDEX_PATH)
        expect(responseStub.args[0][3]).to.have.property('name').to.deep.equal({
          firstName: 'Scrooge',
          lastName: 'McDuck'
        })
        expect(responseStub.args[0][3]).to.have.property('dob').to.deep.equal({
          dobDay: '18',
          dobMonth: '09',
          dobYear: '1940'
        })
      })
    })
  })

  describe('post', () => {
    describe('validation passes', () => {
      const validBody = {
        firstName: 'Scrooge',
        lastName: 'McDuck',
        dobDay: '18',
        dobMonth: '09',
        dobYear: '1940'
      }

      before(() => setupTest('post', {}, {}, {
        body: validBody,
        session: {}
      }))

      it('should redirect to the home address controller', () => {
        expect(res.redirect.calledOnce).to.be.true
        expect(res.redirect.args[0][0]).to.equal(RESPONSIBLE_PERSON_ADDRESS_PATH)
      })

      it('should store form data in session', () => {
        const expectedFormState = {
          name: {
            firstName: validBody.firstName,
            lastName: validBody.lastName
          },
          dob: {
            dobDay: validBody.dobDay,
            dobMonth: validBody.dobMonth,
            dobYear: validBody.dobYear
          }
        }
        expect(_.get(req, FORM_STATE_KEY)).to.deep.equal(expectedFormState)
      })
    })

    describe('validation fails', () => {
      const invalidBody = {
        firstName: 'Scrooge',
        lastName: 'McDuck',
        dobDay: '',
        dobMonth: '',
        dobYear: ''
      }

      before(() => setupTest('post', {}, {}, {
        body: invalidBody,
        session: {}
      }))

      it('should not redirect', () => {
        expect(res.redirect.called).to.be.false
      })

      it('should pass context data to the response method with errors', () => {
        expect(responseStub.args[0][3]).to.have.property('backLink').to.equal(STRIPE_DETAILS_INDEX_PATH)
        expect(responseStub.args[0][3]).to.have.property('name').to.deep.equal({
          firstName: 'Scrooge',
          lastName: 'McDuck'
        })
        expect(responseStub.args[0][3]).to.have.property('dob').to.deep.equal({
          dobDay: '',
          dobMonth: '',
          dobYear: ''
        })
        const formErrors = responseStub.args[0][3].errors.formErrors
        expect(Object.keys(formErrors).length).to.equal(1)
        expect(formErrors).to.deep.include(
          {
            dob: 'Enter the date of birth'
          }
        )
        const errorSummary = responseStub.args[0][3].errors.summary
        expect(errorSummary.length).to.equal(1)
        expect(errorSummary).to.deep.include(
          {
            href: '#dob-day',
            text: 'Enter the date of birth'
          }
        )
      })
    })
    describe('existing form state', () => {
      const validBody = {
        firstName: 'Scrooge',
        lastName: 'McDuck',
        dobDay: '18',
        dobMonth: '09',
        dobYear: '1940'
      }

      const existingFormState = {
        address: {
          homeAddressLine1: 'McDuck Manor',
          homeAddressCity: 'Duckburg',
          homeAddressPostcode: 'SW1A 1AA'
        }
      }

      before(() => setupTest('post', {}, {}, {
        body: validBody,
        session: {
          formState: {
            responsiblePerson: existingFormState
          }
        }
      }))

      it('should merge existing form state with input', () => {
        const expectedFormState = {
          ...existingFormState,
          name: {
            firstName: validBody.firstName,
            lastName: validBody.lastName
          },
          dob: {
            dobDay: validBody.dobDay,
            dobMonth: validBody.dobMonth,
            dobYear: validBody.dobYear
          }
        }
        expect(_.get(req, FORM_STATE_KEY)).to.deep.equal(expectedFormState)
      })
    })
  })
})
