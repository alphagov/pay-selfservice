const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { expect } = require('chai')
const _ = require('lodash')
const { FORM_STATE_KEY } = require('@controllers/simplified-account/settings/stripe-details/responsible-person/constants')

const ACCOUNT_TYPE = 'live'
const SERVICE_ID = 'service-id-123abc'

const RESPONSIBLE_PERSON_ADDRESS_PATH = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.homeAddress, SERVICE_ID, ACCOUNT_TYPE)
const RESPONSIBLE_PERSON_CHECK_ANSWERS_PATH = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.checkYourAnswers, SERVICE_ID, ACCOUNT_TYPE)

let req, res, next, responseStub, responsiblePersonContactDetailsController

const getController = (stubs = {}) => {
  return proxyquire('./responsible-person-contact-details.controller', {
    '@utils/response': { response: stubs.response }
  })
}

const setupTest = (method, additionalStubs = {}, additionalResProps = {}, additionalReqProps = {}) => {
  responseStub = sinon.spy()
  responsiblePersonContactDetailsController = getController({
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
  responsiblePersonContactDetailsController[method][1](req, res, next)
}

describe('Controller: settings/stripe-details/responsible-person-contact-details', () => {
  describe('get', () => {
    describe('no existing form state', () => {
      before(() => setupTest('get'))

      it('should call the response method', () => {
        expect(responseStub.called).to.be.true // eslint-disable-line
      })

      it('should pass req, res and template path to the response method', () => {
        expect(responseStub.args[0]).to.include(req)
        expect(responseStub.args[0]).to.include(res)
        expect(responseStub.args[0][2]).to.equal('simplified-account/settings/stripe-details/responsible-person/contact-details')
      })

      it('should pass context data to the response method', () => {
        expect(responseStub.args[0][3]).to.have.property('backLink').to.equal(RESPONSIBLE_PERSON_ADDRESS_PATH)
        expect(responseStub.args[0][3]).to.have.property('contact').to.be.undefined // eslint-disable-line
      })
    })
    describe('existing form state', () => {
      before(() => setupTest('get', {}, {}, {
        session: {
          formState: {
            responsiblePerson: {
              contact: {
                workTelephoneNumber: '01611234567',
                workEmail: 'scrooge.mcduck@pay.gov.uk'
              }
            }
          }
        }
      }))

      it('should pass context data to the response method', () => {
        expect(responseStub.args[0][3]).to.have.property('backLink').to.equal(RESPONSIBLE_PERSON_ADDRESS_PATH)
        expect(responseStub.args[0][3]).to.have.property('contact').to.deep.equal({
          workTelephoneNumber: '01611234567',
          workEmail: 'scrooge.mcduck@pay.gov.uk'
        })
      })
    })
  })

  describe('post', () => {
    describe('validation passes', () => {
      const validBody = {
        workTelephoneNumber: '01611234567',
        workEmail: 'scrooge.mcduck@pay.gov.uk'
      }

      before(() => setupTest('post', {}, {}, {
        body: validBody,
        session: {}
      }))

      it('should redirect to the check answers controller', () => {
        expect(res.redirect.calledOnce).to.be.true // eslint-disable-line
        expect(res.redirect.args[0][0]).to.equal(RESPONSIBLE_PERSON_CHECK_ANSWERS_PATH)
      })

      it('should store form data in session', () => {
        const expectedFormState = {
          contact: {
            workTelephoneNumber: validBody.workTelephoneNumber,
            workEmail: validBody.workEmail
          }
        }
        expect(_.get(req, FORM_STATE_KEY)).to.deep.equal(expectedFormState)
      })
    })

    describe('validation fails', () => {
      const invalidBody = {
        workTelephoneNumber: 'not a number',
        workEmail: 'not an email address'
      }

      before(() => setupTest('post', {}, {}, {
        body: invalidBody,
        session: {}
      }))

      it('should not redirect', () => {
        expect(res.redirect.called).to.be.false // eslint-disable-line
      })

      it('should pass context data to the response method with errors', () => {
        expect(responseStub.args[0][3]).to.have.property('backLink').to.equal(RESPONSIBLE_PERSON_ADDRESS_PATH)
        expect(responseStub.args[0][3]).to.have.property('contact').to.deep.equal(invalidBody)
        const formErrors = responseStub.args[0][3].errors.formErrors
        expect(Object.keys(formErrors).length).to.equal(2)
        expect(formErrors).to.deep.include(
          {
            workEmail: 'Enter a real email address'
          }
        )
        const errorSummary = responseStub.args[0][3].errors.summary
        expect(errorSummary.length).to.equal(2)
        expect(errorSummary).to.deep.include(
          {
            href: '#work-telephone-number',
            text: 'Enter a valid work telephone number'
          }
        )
      })
    })

    describe('existing form state', () => {
      const validBody = {
        workTelephoneNumber: '01611234567',
        workEmail: 'scrooge.mcduck@pay.gov.uk'
      }

      const existingFormState = {
        name: {
          firstName: 'Scrooge',
          lastName: 'McDuck'
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
          contact: {
            workTelephoneNumber: validBody.workTelephoneNumber,
            workEmail: validBody.workEmail
          }
        }
        expect(_.get(req, FORM_STATE_KEY)).to.deep.equal(expectedFormState)
      })
    })
  })
})
