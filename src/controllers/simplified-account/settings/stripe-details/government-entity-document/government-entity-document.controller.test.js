const sinon = require('sinon')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const { GOV_ENTITY_DOC_FORM_FIELD_NAME } = require('@controllers/simplified-account/settings/stripe-details/government-entity-document/constants')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const { expect } = require('chai')
const paths = require('@root/paths')

const mockResponse = sinon.stub()
const mockStripeDetailsService = {
  updateStripeDetailsUploadEntityDocument: sinon.stub().resolves()
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
} = new ControllerTestBuilder('@controllers/simplified-account/settings/stripe-details/government-entity-document/government-entity-document.controller')
  .withServiceExternalId(SERVICE_ID)
  .withAccountType(ACCOUNT_TYPE)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/stripe-details.service': mockStripeDetailsService
  })
  .build()

describe('Controller: settings/stripe-details/government-entity-document', () => {
  describe('get', () => {
    beforeEach(async () => {
      await call('get', 1)
    })

    it('should call the response method', () => {
      expect(mockResponse.called).to.be.true
    })

    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse.args[0][0]).to.deep.equal(req)
      expect(mockResponse.args[0][1]).to.deep.equal(res)
      expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/stripe-details/government-entity-document/index')
    })

    it('should pass context data to the response method', () => {
      expect(mockResponse.args[0][3]).to.have.property('backLink').to.equal(STRIPE_DETAILS_INDEX_PATH)
      expect(mockResponse.args[0][3]).to.have.property('uploadField').to.equal(GOV_ENTITY_DOC_FORM_FIELD_NAME)
    })
  })
  describe('post', () => {
    describe('when uploading a valid file', () => {
      beforeEach(async () => {
        nextRequest({
          file: {
            size: 10 * 1024 * 1024,
            mimetype: 'image/jpeg'
          }
        })
        await call('post', 1)
      })

      it('should submit the file to the stripe details service', () => {
        expect(mockStripeDetailsService.updateStripeDetailsUploadEntityDocument).to.have.been.calledWith(
          sinon.match.any,
          sinon.match.any,
          {
            size: 10485760,
            mimetype: 'image/jpeg'
          }
        )
      })

      it('should set message', () => {
        expect(req.flash).to.have.been.calledWith('messages', { state: 'success', icon: '&check;', heading: 'Information sent to Stripe', body: 'Stripe is checking your information. We will contact you if there is a problem' })
      })

      it('should redirect to the stripe details index', () => {
        expect(res.redirect).to.have.been.calledWith(STRIPE_DETAILS_INDEX_PATH)
      })
    })

    describe('when submitting invalid data', () => {
      describe('file is too large', () => {
        beforeEach(async () => {
          nextRequest({
            file: {
              size: 11 * 1024 * 1024,
              mimetype: 'image/jpeg'
            }
          })
          await call('post', 1)
        })

        it('should not submit the file to the stripe details service', () => {
          expect(mockStripeDetailsService.updateStripeDetailsUploadEntityDocument).to.not.have.been.called
        })

        it('should not set message', () => {
          expect(req.flash).to.not.have.been.called
        })

        it('should not redirect to the stripe details index', () => {
          expect(res.redirect).to.not.have.been.called
        })

        it('should call response with errors', () => {
          expect(mockResponse).to.have.been.calledWith(
            sinon.match.any,
            sinon.match.any,
            'simplified-account/settings/stripe-details/government-entity-document/index',
            {
              errors: {
                summary: [
                  { text: 'File size must be less than 10MB', href: '#government-entity-document' }
                ],
                formErrors: {
                  governmentEntityDocument: 'File size must be less than 10MB'
                }
              },
              backLink: STRIPE_DETAILS_INDEX_PATH,
              uploadField: GOV_ENTITY_DOC_FORM_FIELD_NAME
            }
          )
        })
      })

      describe('mimetype is incorrect', () => {
        beforeEach(async () => {
          nextRequest({
            file: {
              size: 10 * 1024 * 1024,
              mimetype: 'application/json'
            }
          })
          await call('post', 1)
        })

        it('should not submit the file to the stripe details service', () => {
          expect(mockStripeDetailsService.updateStripeDetailsUploadEntityDocument).to.not.have.been.called
        })

        it('should not set message', () => {
          expect(req.flash).to.not.have.been.called
        })

        it('should not redirect to the stripe details index', () => {
          expect(res.redirect).to.not.have.been.called
        })

        it('should call response with errors', () => {
          expect(mockResponse).to.have.been.calledWith(
            sinon.match.any,
            sinon.match.any,
            'simplified-account/settings/stripe-details/government-entity-document/index',
            {
              errors: {
                summary: [
                  { text: 'File type must be PDF, JPG or PNG', href: '#government-entity-document' }
                ],
                formErrors: {
                  governmentEntityDocument: 'File type must be PDF, JPG or PNG'
                }
              },
              backLink: STRIPE_DETAILS_INDEX_PATH,
              uploadField: GOV_ENTITY_DOC_FORM_FIELD_NAME
            }
          )
        })
      })
      describe('file is missing', () => {
        beforeEach(async () => {
          nextRequest({
          })
          await call('post', 1)
        })

        it('should not submit the file to the stripe details service', () => {
          expect(mockStripeDetailsService.updateStripeDetailsUploadEntityDocument).to.not.have.been.called
        })

        it('should not set message', () => {
          expect(req.flash).to.not.have.been.called
        })

        it('should not redirect to the stripe details index', () => {
          expect(res.redirect).to.not.have.been.called
        })

        it('should call response with errors', () => {
          expect(mockResponse).to.have.been.calledWith(
            sinon.match.any,
            sinon.match.any,
            'simplified-account/settings/stripe-details/government-entity-document/index',
            {
              errors: {
                summary: [
                  { text: 'Select a file to upload', href: '#government-entity-document' }
                ],
                formErrors: {
                  governmentEntityDocument: 'Select a file to upload'
                }
              },
              backLink: STRIPE_DETAILS_INDEX_PATH,
              uploadField: GOV_ENTITY_DOC_FORM_FIELD_NAME
            }
          )
        })
      })
    })

    describe('when the Stripe API returns an error', () => {
      beforeEach(async () => {
        nextStubs({
          '@services/stripe-details.service': {
            updateStripeDetailsUploadEntityDocument: sinon.stub().rejects({ type: 'StripeInvalidRequestError', param: 'file' })
          }
        })
        nextRequest({
          file: {
            size: 10 * 1024 * 1024,
            mimetype: 'image/jpeg'
          }
        })
        await call('post', 1)
      })

      it('should not set message', () => {
        expect(req.flash).to.not.have.been.called
      })

      it('should not redirect to the stripe details index', () => {
        expect(res.redirect).to.not.have.been.called
      })

      it('should call response with errors', () => {
        expect(mockResponse).to.have.been.calledWith(
          sinon.match.any,
          sinon.match.any,
          'simplified-account/settings/stripe-details/government-entity-document/index',
          {
            errors: {
              summary: [
                { text: 'Error uploading file to Stripe. Try uploading a file with one of the following types: pdf, jpeg, png', href: '#government-entity-document' }
              ]
            },
            backLink: STRIPE_DETAILS_INDEX_PATH,
            uploadField: GOV_ENTITY_DOC_FORM_FIELD_NAME
          }
        )
      })
    })
  })
})
