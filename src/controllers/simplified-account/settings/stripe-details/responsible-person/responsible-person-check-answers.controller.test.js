const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { expect } = require('chai')
const _ = require('lodash')
const { FORM_STATE_KEY } = require('@controllers/simplified-account/settings/stripe-details/responsible-person/constants')

const ACCOUNT_TYPE = 'live'
const SERVICE_ID = 'service-id-123abc'
const STRIPE_DETAILS_INDEX_PATH = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, SERVICE_ID, ACCOUNT_TYPE)
const RESPONSIBLE_PERSON_INDEX_PATH = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.index, SERVICE_ID, ACCOUNT_TYPE)
const RESPONSIBLE_PERSON_ADDRESS_PATH = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.homeAddress, SERVICE_ID, ACCOUNT_TYPE)
const RESPONSIBLE_PERSON_CONTACT_PATH = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.responsiblePerson.contactDetails, SERVICE_ID, ACCOUNT_TYPE)

let req, res, next, responseStub, updateStripeDetailsResponsiblePersonStub, responsiblePersonCheckAnswersController

const getController = (stubs = {}) => {
  return proxyquire('./responsible-person-check-answers.controller', {
    '@utils/response': { response: stubs.response },
    '@services/stripe-details.service': {
      updateStripeDetailsResponsiblePerson: stubs.updateStripeDetailsResponsiblePerson
    }
  })
}

const setupTest = (method, additionalStubs = {}, additionalResProps = {}, additionalReqProps = {}) => {
  responseStub = sinon.spy()
  updateStripeDetailsResponsiblePersonStub = sinon.stub().resolves()
  responsiblePersonCheckAnswersController = getController({
    response: responseStub,
    updateStripeDetailsResponsiblePerson: updateStripeDetailsResponsiblePersonStub,
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
  responsiblePersonCheckAnswersController[method][1](req, res, next)
}

describe('Controller: settings/stripe-details/responsible-person/responsible-person-check-answers', () => {
  describe('get', () => {
    describe('no existing form state', () => {
      before(() => setupTest('get'))

      it('should redirect the user to the start of the journey', () => {
        expect(res.redirect.calledOnce).to.be.true
        expect(res.redirect.args[0][0]).to.include(RESPONSIBLE_PERSON_INDEX_PATH)
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
      const existingAddress = {
        homeAddressLine1: 'McDuck Manor',
        homeAddressLine2: 'The Money Bin',
        homeAddressCity: 'Duckburg',
        homeAddressPostcode: 'SW1A 1AA'
      }
      const existingContact = {
        workTelephoneNumber: '01611234567',
        workEmail: 'scrooge.mcduck@pay.gov.uk'
      }
      before(() => setupTest('get', {}, {}, {
        session: {
          formState: {
            responsiblePerson: {
              name: existingName,
              dob: existingDob,
              address: existingAddress,
              contact: existingContact
            }
          }
        }
      }))

      it('should call the response method', () => {
        expect(responseStub.called).to.be.true
      })

      it('should pass req, res and template path to the response method', () => {
        expect(responseStub.args[0]).to.include(req)
        expect(responseStub.args[0]).to.include(res)
        expect(responseStub.args[0]).to.include('simplified-account/settings/stripe-details/responsible-person/check-your-answers')
      })

      it('should pass context data to the response method', () => {
        expect(responseStub.args[0][3]).to.have.property('backLink').to.equal(RESPONSIBLE_PERSON_CONTACT_PATH)
        expect(responseStub.args[0][3]).to.have.property('changeResponsiblePersonLink').to.equal(RESPONSIBLE_PERSON_INDEX_PATH)
        expect(responseStub.args[0][3]).to.have.property('changeHomeAddressLink').to.equal(RESPONSIBLE_PERSON_ADDRESS_PATH)
        expect(responseStub.args[0][3]).to.have.property('changeContactDetailsLink').to.equal(RESPONSIBLE_PERSON_CONTACT_PATH)
      })

      it('should include correctly formatted answers in context data', () => {
        const answers = responseStub.args[0][3].answers
        expect(answers.name).to.equal('Scrooge McDuck')
        expect(answers.dob).to.equal('1940-09-18')
        expect(answers.address).to.equal('McDuck Manor<br>The Money Bin<br>Duckburg<br>SW1A 1AA')
        expect(answers.phone).to.equal('+44 161 123 4567')
        expect(answers.email).to.equal('scrooge.mcduck@pay.gov.uk')
      })
    })
  })

  describe('post', () => {
    const validResponsiblePerson = {
      name: {
        firstName: 'Scrooge',
        lastName: 'McDuck'
      },
      dob: {
        dobDay: '18',
        dobMonth: '09',
        dobYear: '1940'
      },
      address: {
        homeAddressLine1: 'McDuck Manor',
        homeAddressLine2: 'The Money Bin',
        homeAddressCity: 'Duckburg',
        homeAddressPostcode: 'SW1A 1AA'
      },
      contact: {
        workTelephoneNumber: '01611234567',
        workEmail: 'scrooge.mcduck@pay.gov.uk'
      }
    }

    describe('when submitting a valid responsible person', () => {
      before(() => setupTest('post', {}, {}, {
        session: {
          formState: {
            responsiblePerson: validResponsiblePerson
          }
        }
      }))

      it('should submit responsible person to the stripe details service', () => {
        const call = updateStripeDetailsResponsiblePersonStub.getCall(0)
        expect(call).to.not.be.null
        expect(call.args).to.deep.equal([
          req.service,
          req.account,
          {
            first_name: 'Scrooge',
            last_name: 'McDuck',
            dob_day: 18,
            dob_month: 9,
            dob_year: 1940,
            phone: '+44 161 123 4567',
            email: 'scrooge.mcduck@pay.gov.uk',
            address_line1: 'McDuck Manor',
            address_line2: 'The Money Bin',
            address_city: 'Duckburg',
            address_postcode: 'SW1A 1AA'
          }
        ])
      })

      it('should unset the form state key', () => {
        expect(_.get(req, FORM_STATE_KEY)).to.be.undefined
      })

      it('should redirect to the stripe details index page', () => {
        expect(res.redirect.calledOnce).to.be.true
        expect(res.redirect.args[0][0]).to.include(STRIPE_DETAILS_INDEX_PATH)
      })
    })

    describe('when Stripe API returns errors', () => {
      describe('for invalid phone number', () => {
        before(() => {
          setupTest('post',
            {
              updateStripeDetailsResponsiblePerson: sinon.stub().rejects({
                type: 'StripeInvalidRequestError',
                param: 'phone'
              })
            },
            {},
            {
              session: {
                formState: {
                  responsiblePerson: validResponsiblePerson
                }
              }
            }
          )
        })

        it('should render the check your answers view with an appropriate error message', () => {
          expect(responseStub.calledOnce).to.be.true
          const responseArgs = responseStub.firstCall.args
          expect(responseArgs[3].errors.summary[0].text).to.equal(
            'There is a problem with your telephone number. Please check your answer and try again.'
          )
        })
      })

      describe('for unhandled invalid request errors', () => {
        before(() => {
          setupTest('post',
            {
              updateStripeDetailsResponsiblePerson: sinon.stub().rejects({
                type: 'StripeInvalidRequestError',
                param: 'foo'
              })
            },
            {},
            {
              session: {
                formState: {
                  responsiblePerson: validResponsiblePerson
                }
              }
            }
          )
        })

        it('should render the check your answers view with an appropriate error message', () => {
          expect(responseStub.calledOnce).to.be.true
          const responseArgs = responseStub.firstCall.args
          expect(responseArgs[3].errors.summary[0].text).to.equal(
            'There is a problem with the information you\'ve submitted. We\'ve not been able to save your details. Email govuk-pay-support@digital.cabinet-office.gov.uk for help.'
          )
        })
      })

      describe('for any other errors', () => {
        before(() => {
          setupTest('post',
            {
              updateStripeDetailsResponsiblePerson: sinon.stub().rejects({
                foo: 'bar'
              })
            },
            {},
            {
              session: {
                formState: {
                  responsiblePerson: validResponsiblePerson
                }
              }
            }
          )
        })

        it('should pass the error to next middleware', () => {
          expect(next.calledOnce).to.be.true
          expect(next.firstCall.args[0].foo).to.equal('bar')
        })
      })
    })
  })
})
