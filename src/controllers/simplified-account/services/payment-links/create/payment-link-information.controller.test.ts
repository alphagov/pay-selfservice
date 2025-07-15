import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { expect } from 'chai'
import { PaymentLinkCreationSession } from '@controllers/simplified-account/services/payment-links/constants'

const SERVICE_EXTERNAL_ID = 'service123abc'
const GATEWAY_ACCOUNT_ID = 117
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'gateway-account-external-id-123'
const SERVICE_NAME = 'Test Service'
const WELSH_SERVICE_NAME = 'Gwasanaeth Prawf'

const mockResponse = sinon.spy()

const { res, req, call, nextRequest } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/payment-links/create/payment-link-information.controller'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount({
    id: GATEWAY_ACCOUNT_ID,
    externalId: GATEWAY_ACCOUNT_EXTERNAL_ID,
    type: GatewayAccountType.TEST,
  })
  .withService({
    externalId: SERVICE_EXTERNAL_ID,
    name: SERVICE_NAME,
    serviceName: {
      en: SERVICE_NAME,
      cy: WELSH_SERVICE_NAME
    }
  })
  .withUser({
    email: 'test@example.com',
  })
  .withStubs({
    '@utils/response': { response: mockResponse },
  })
  .build()

req.session = req.session || {}

describe('Controller: services/payment-links/create (Step 1)', () => {
  beforeEach(() => {
    mockResponse.resetHistory()
    req.session = req.session || {}
    const session = req.session as unknown as PaymentLinkCreationSession
    if (session.pageData?.createPaymentLink) {
      delete session.pageData.createPaymentLink
    }
  })

  afterEach(() => {
    const session = req.session as unknown as PaymentLinkCreationSession
    if (session.pageData?.createPaymentLink) {
      delete session.pageData.createPaymentLink
    }
  })

  describe('get', () => {
    describe('without existing session data', () => {
      beforeEach(async () => {
        await call('get')
      })

      it('should call the response method with correct parameters', () => {
        sinon.assert.calledWith(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/services/payment-links/create/index',
          sinon.match({
            service: sinon.match.object,
            account: sinon.match.object,
            backLink: formatServiceAndAccountPathsFor(
              paths.simplifiedAccount.paymentLinks.index,
              SERVICE_EXTERNAL_ID,
              GatewayAccountType.TEST
            ),
            formValues: { name: '', description: '' },
            friendlyURL: process.env.PRODUCTS_FRIENDLY_BASE_URI,
            serviceName: SERVICE_NAME,
            isWelsh: false,
            serviceMode: GatewayAccountType.TEST
          })
        )
      })
    })

    describe('with existing session data', () => {
      beforeEach(async () => {
        const session = req.session as unknown as PaymentLinkCreationSession
        session.pageData = {
          createPaymentLink: {
            paymentLinkTitle: 'Existing Title',
            paymentLinkDescription: 'Existing Description',
            isWelsh: false
          }
        }
        await call('get')
      })

      it('should populate form values from session data', () => {
        sinon.assert.calledWith(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/services/payment-links/create/index',
          sinon.match({
            formValues: { name: 'Existing Title', description: 'Existing Description' }
          })
        )
      })
    })

    describe('Welsh language handling', () => {
      beforeEach(async () => {
        nextRequest({
          query: { language: 'cy' }
        })
        await call('get')
      })

      it('should use Welsh service name when language is cy', () => {
        sinon.assert.calledWith(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/services/payment-links/create/index',
          sinon.match({
            serviceName: WELSH_SERVICE_NAME,
            isWelsh: true
          })
        )
      })
    })

    describe('when Welsh is indicated from session data', () => {
      beforeEach(async () => {
        const session = req.session as unknown as PaymentLinkCreationSession
        session.pageData = {
          createPaymentLink: {
            isWelsh: true
          }
        }
        await call('get')
      })

      it('should use Welsh service name when session indicates Welsh', () => {
        sinon.assert.calledWith(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/services/payment-links/create/index',
          sinon.match({
            serviceName: WELSH_SERVICE_NAME,
            isWelsh: true
          })
        )
      })
    })
  })

  describe('post', () => {
    describe('successful form submission', () => {
      beforeEach(async () => {
        nextRequest({
          body: {
            name: 'Test Payment Link',
            description: 'A description',
          },
        })
        await call('post')
      })

      it('should not call response method when form is valid', () => {
        sinon.assert.notCalled(mockResponse)
      })

      it('should redirect to reference page', () => {
        sinon.assert.calledWith(
          res.redirect,
          formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.paymentLinks.reference,
            SERVICE_EXTERNAL_ID,
            GatewayAccountType.TEST
          )
        )
      })
    })

    describe('successful form submission with Welsh language', () => {
      beforeEach(async () => {
        nextRequest({
          query: { language: 'cy' },
          body: {
            name: 'Test Payment Link',
            description: 'A description',
          },
        })
        await call('post')
      })

      it('should redirect without calling response method', () => {
        sinon.assert.notCalled(mockResponse)
      })
    })

    describe('validation errors', () => {
      describe('missing required fields', () => {
        beforeEach(async () => {
          nextRequest({
            body: {
              name: '',
              description: '',
            },
          })
          await call('post')
        })

        it('should call response with errors', () => {
          sinon.assert.calledWith(
            mockResponse,
            sinon.match.any,
            sinon.match.any,
            'simplified-account/services/payment-links/create/index',
            sinon.match({
              errors: sinon.match.object,
              formValues: sinon.match.object,
              friendlyURL: process.env.PRODUCTS_FRIENDLY_BASE_URI,
              serviceName: SERVICE_NAME,
              isWelsh: false,
              serviceMode: GatewayAccountType.TEST
            })
          )
        })

        it('should not save session data', () => {
          const session = req.session as unknown as PaymentLinkCreationSession
          expect(session.pageData?.createPaymentLink).to.equal(undefined)
        })
      })

      describe('when the title is too long', () => {
        beforeEach(async () => {
          nextRequest({
            body: {
              name: 'a'.repeat(231),
              description: 'Valid description',
            },
          })
          await call('post')
        })

        it('should return validation error', () => {
          sinon.assert.calledWith(
            mockResponse,
            sinon.match.any,
            sinon.match.any,
            'simplified-account/services/payment-links/create/index',
            sinon.match.has('errors')
          )
        })

        it('should not save session data when validation fails', () => {
          const session = req.session as unknown as PaymentLinkCreationSession
          expect(session.pageData?.createPaymentLink).to.equal(undefined)
        })
      })

      describe('when the title is at maximum length', () => {
        beforeEach(async () => {
          nextRequest({
            body: {
              name: 'a'.repeat(230),
              description: 'Valid description',
            },
          })
          await call('post')
        })

        it('should successfully redirect to reference page', () => {
          sinon.assert.calledWith(
            res.redirect,
            formatServiceAndAccountPathsFor(
              paths.simplifiedAccount.paymentLinks.reference,
              SERVICE_EXTERNAL_ID,
              GatewayAccountType.TEST
            )
          )
        })
      })

      describe('validation errors with Welsh language', () => {
        beforeEach(async () => {
          nextRequest({
            query: { language: 'cy' },
            body: {
              name: '',
              description: '',
            },
          })
          await call('post')
        })

        it('should show errors in Welsh context', () => {
          sinon.assert.calledWith(
            mockResponse,
            sinon.match.any,
            sinon.match.any,
            'simplified-account/services/payment-links/create/index',
            sinon.match({
              errors: sinon.match.object,
              serviceName: WELSH_SERVICE_NAME,
              isWelsh: true
            })
          )
        })
      })
    })
  })
})
