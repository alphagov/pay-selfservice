const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { expect } = require('chai')
const _ = require('lodash')
const { FORM_STATE_KEY } = require('@controllers/simplified-account/settings/stripe-details/responsible-person/constants')

const ACCOUNT_TYPE = 'live'
const SERVICE_ID = 'service-id-123abc'

const RESPONSIBLE_PERSON_INDEX_PATH = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.index, SERVICE_ID, ACCOUNT_TYPE)
const RESPONSIBLE_PERSON_CONTACT_PATH = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.contactDetails, SERVICE_ID, ACCOUNT_TYPE)

let req, res, next, responseStub, responsiblePersonHomeAddressController

const getController = (stubs = {}) => {
  return proxyquire('./responsible-person-home-address.controller', {
    '@utils/response': { response: stubs.response }
  })
}

const setupTest = (method, additionalStubs = {}, additionalResProps = {}, additionalReqProps = {}) => {
  responseStub = sinon.spy()
  responsiblePersonHomeAddressController = getController({
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
  responsiblePersonHomeAddressController[method][1](req, res, next)
}

describe('Controller: settings/stripe-details/responsible-person-home-address', () => {
  describe('get', () => {
    describe('no existing form state', () => {
      before(() => setupTest('get'))

      it('should call the response method', () => {
        expect(responseStub.called).to.be.true // eslint-disable-line
      })

      it('should pass req, res and template path to the response method', () => {
        expect(responseStub.args[0]).to.include(req)
        expect(responseStub.args[0]).to.include(res)
        expect(responseStub.args[0][2]).to.equal('simplified-account/settings/stripe-details/responsible-person/home-address')
      })

      it('should pass context data to the response method', () => {
        expect(responseStub.args[0][3]).to.have.property('backLink').to.equal(RESPONSIBLE_PERSON_INDEX_PATH)
        expect(responseStub.args[0][3]).to.have.property('address').to.be.undefined // eslint-disable-line
      })
    })
    describe('existing form state', () => {
      before(() => setupTest('get', {}, {}, {
        session: {
          formState: {
            responsiblePerson: {
              address: {
                homeAddressLine1: 'McDuck Manor',
                homeAddressLine2: 'The Money Bin',
                homeAddressCity: 'Duckburg',
                homeAddressPostcode: 'SW1A 1AA'
              }
            }
          }
        }
      }))

      it('should pass context data to the response method', () => {
        expect(responseStub.args[0][3]).to.have.property('backLink').to.equal(RESPONSIBLE_PERSON_INDEX_PATH)
        expect(responseStub.args[0][3]).to.have.property('address').to.deep.equal({
          homeAddressLine1: 'McDuck Manor',
          homeAddressLine2: 'The Money Bin',
          homeAddressCity: 'Duckburg',
          homeAddressPostcode: 'SW1A 1AA'
        })
      })
    })
  })

  describe('post', () => {
    describe('validation passes', () => {
      const validBody = {
        homeAddressLine1: 'McDuck Manor',
        homeAddressLine2: '',
        homeAddressCity: 'Duckburg',
        homeAddressPostcode: 'SW1A 1AA'
      }

      before(() => setupTest('post', {}, {}, {
        body: validBody,
        session: {}
      }))

      it('should redirect to the check answers controller', () => {
        expect(res.redirect.calledOnce).to.be.true // eslint-disable-line
        expect(res.redirect.args[0][0]).to.equal(RESPONSIBLE_PERSON_CONTACT_PATH)
      })

      it('should store form data in session', () => {
        const expectedFormState = {
          address: {
            homeAddressLine1: validBody.homeAddressLine1,
            homeAddressLine2: '',
            homeAddressCity: validBody.homeAddressCity,
            homeAddressPostcode: validBody.homeAddressPostcode
          }
        }
        expect(_.get(req, FORM_STATE_KEY)).to.deep.equal(expectedFormState)
      })
    })

    describe('validation fails', () => {
      const invalidBody = {
        homeAddressLine1: '',
        homeAddressLine2: '',
        homeAddressCity: 'Duckburg',
        homeAddressPostcode: 'S123 LOL'
      }

      before(() => setupTest('post', {}, {}, {
        body: invalidBody,
        session: {}
      }))

      it('should not redirect', () => {
        expect(res.redirect.called).to.be.false // eslint-disable-line
      })

      it('should pass context data to the response method with errors', () => {
        expect(responseStub.args[0][3]).to.have.property('backLink').to.equal(RESPONSIBLE_PERSON_INDEX_PATH)
        expect(responseStub.args[0][3]).to.have.property('address').to.deep.equal(invalidBody)
        const formErrors = responseStub.args[0][3].errors.formErrors
        expect(Object.keys(formErrors).length).to.equal(2)
        expect(formErrors).to.deep.include(
          {
            homeAddressLine1: 'Address line 1 is required'
          }
        )
        const errorSummary = responseStub.args[0][3].errors.summary
        expect(errorSummary.length).to.equal(2)
        expect(errorSummary).to.deep.include(
          {
            href: '#home-address-postcode',
            text: 'Enter a real postcode'
          }
        )
      })
    })

    describe('existing form state', () => {
      const validBody = {
        homeAddressLine1: 'McDuck Manor',
        homeAddressLine2: 'The Money Bin',
        homeAddressCity: 'Duckburg',
        homeAddressPostcode: 'SW1A 1AA'
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
          address: {
            homeAddressLine1: validBody.homeAddressLine1,
            homeAddressLine2: validBody.homeAddressLine2,
            homeAddressCity: validBody.homeAddressCity,
            homeAddressPostcode: validBody.homeAddressPostcode
          }
        }
        expect(_.get(req, FORM_STATE_KEY)).to.deep.equal(expectedFormState)
      })
    })
  })
})
