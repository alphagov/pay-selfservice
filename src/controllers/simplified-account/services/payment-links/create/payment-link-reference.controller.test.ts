import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import formatAccountPathsFor from '@utils/format-account-paths-for'
import paths from '@root/paths'
import { PaymentLinkCreationSession } from '@controllers/simplified-account/services/payment-links/constants'

const SERVICE_EXTERNAL_ID = 'service123abc'
const GATEWAY_ACCOUNT_ID = 117
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'gateway-account-external-id-123'
const SERVICE_NAME = 'Test Service'

const mockResponse = sinon.spy()

const { res, req, call, nextRequest } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/payment-links/create/payment-link-reference.controller'
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
  })
  .withUser({
    email: 'test@example.com',
  })
  .withStubs({
    '@utils/response': { response: mockResponse },
  })
  .build()

req.session = req.session || {}

describe('Controller: services/payment-links/reference (Step 2)', () => {
  beforeEach(() => {
    mockResponse.resetHistory()
    req.session = req.session || {}
  })

  afterEach(() => {
    const session = req.session as PaymentLinkCreationSession
    if (session.pageData?.createPaymentLink) {
      delete session.pageData.createPaymentLink
    }
  })

  describe('get', () => {
    describe('with English session data', () => {
      beforeEach(async () => {
        const session = req.session as PaymentLinkCreationSession
        session.pageData = {
          createPaymentLink: {
            paymentLinkTitle: 'Test Payment Link',
            paymentLinkDescription: 'A description',
            serviceNamePath: 'test-service',
            productNamePath: 'test-payment-link',
            isWelsh: false,
          }
        }

        await call('get')
      })

      it('should call the response method with correct parameters', () => {
        sinon.assert.calledWith(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/services/payment-links/create/reference',
          sinon.match({
            service: sinon.match.object,
            account: sinon.match.object,
            backLink: formatServiceAndAccountPathsFor(
              paths.simplifiedAccount.paymentLinks.create,
              SERVICE_EXTERNAL_ID,
              GatewayAccountType.TEST
            ),
            formValues: {},
            isWelsh: false,
            serviceMode: GatewayAccountType.TEST
          })
        )
      })
    })

    describe('with Welsh session data', () => {
      beforeEach(async () => {
        const session = req.session as PaymentLinkCreationSession
        session.pageData = {
          createPaymentLink: {
            paymentLinkTitle: 'Test Payment Link',
            paymentLinkDescription: 'A description',
            serviceNamePath: 'test-service',
            productNamePath: 'test-payment-link',
            isWelsh: true,
          }
        }

        await call('get')
      })

      it('should handle Welsh language from session', () => {
        sinon.assert.calledWith(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/services/payment-links/create/reference',
          sinon.match({
            isWelsh: true,
            serviceMode: GatewayAccountType.TEST
          })
        )
      })
    })
  })

  describe('post', () => {
    describe('successful creation with custom reference', () => {
      beforeEach(async () => {
        const session = req.session as PaymentLinkCreationSession
        session.pageData = {
          createPaymentLink: {
            paymentLinkTitle: 'Test Payment Link',
            paymentLinkDescription: 'A description',
            serviceNamePath: 'test-service',
            productNamePath: 'test-payment-link',
            isWelsh: false,
          }
        }

        nextRequest({
          body: {
            reference: 'yes',
            referenceLabel: 'Invoice number',
            referenceHint: 'Enter your invoice number',
          },
        })
        await call('post')
      })

      it('should process request successfully and redirect to the old review page (for now)', () => {
        sinon.assert.calledWith(
          res.redirect,
          formatAccountPathsFor(paths.account.paymentLinks.review, GATEWAY_ACCOUNT_EXTERNAL_ID)
        )
      })

      it('should not call response method when the form is valid', () => {
        sinon.assert.notCalled(mockResponse)
      })
    })

    describe('successful creation with GOV.UK generated reference', () => {
      beforeEach(async () => {
        const session = req.session as PaymentLinkCreationSession
        session.pageData = {
          createPaymentLink: {
            paymentLinkTitle: 'Test Payment Link',
            paymentLinkDescription: 'A description',
            serviceNamePath: 'test-service',
            productNamePath: 'test-payment-link',
            isWelsh: false,
          }
        }

        nextRequest({
          body: {
            reference: 'no',
          },
        })
        await call('post')
      })

      it('should process request successfully and redirect to the old review page (for now)', () => {
        sinon.assert.calledWith(
          res.redirect,
          formatAccountPathsFor(paths.account.paymentLinks.review, GATEWAY_ACCOUNT_EXTERNAL_ID)
        )
      })

      it('should not call response method when form is valid', () => {
        sinon.assert.notCalled(mockResponse)
      })
    })

    describe('Welsh language handling', () => {
      beforeEach(async () => {
        const session = req.session as PaymentLinkCreationSession
        session.pageData = {
          createPaymentLink: {
            paymentLinkTitle: 'Dolen Talu Prawf',
            paymentLinkDescription: 'Disgrifiad',
            serviceNamePath: 'test-service',
            productNamePath: 'test-payment-link',
            isWelsh: true,
          }
        }

        nextRequest({
          body: {
            reference: 'yes',
            referenceLabel: 'Rhif anfoneb',
            referenceHint: 'Mae rhif yr anfoneb yn y gornel dde uchaf yr anfoneb',
          },
        })
        await call('post')
      })

      it('should redirect successfully', () => {
        sinon.assert.calledWith(
          res.redirect,
          formatAccountPathsFor(paths.account.paymentLinks.review, GATEWAY_ACCOUNT_EXTERNAL_ID)
        )
      })
    })

    describe('when the session data (createPaymentLink) is missing', () => {
      beforeEach(async () => {
        const session = req.session as PaymentLinkCreationSession
        session.pageData = {}

        nextRequest({
          body: {
            reference: 'yes',
            referenceLabel: 'Invoice number',
          },
        })
        await call('post')
      })

      it('should redirect back to the information page', () => {
        sinon.assert.calledWith(
          res.redirect,
          formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.paymentLinks.create,
            SERVICE_EXTERNAL_ID,
            GatewayAccountType.TEST
          )
        )
      })

      it('should not call response method', () => {
        sinon.assert.notCalled(mockResponse)
      })
    })

    describe('validation errors', () => {
      beforeEach(() => {
        const session = req.session as PaymentLinkCreationSession
        session.pageData = {
          createPaymentLink: {
            paymentLinkTitle: 'Test Payment Link',
            paymentLinkDescription: 'A description',
            serviceNamePath: 'test-service',
            productNamePath: 'test-payment-link',
            isWelsh: false,
          }
        }
      })

      describe('when the reference label is missing but the reference is enabled', () => {
        beforeEach(async () => {
          nextRequest({
            body: {
              reference: 'yes',
              referenceLabel: '',
            },
          })
          await call('post')
        })

        it('should return validation error', () => {
          sinon.assert.calledWith(
            mockResponse,
            sinon.match.any,
            sinon.match.any,
            'simplified-account/services/payment-links/create/reference',
            sinon.match.has('errors')
          )
        })
      })
    })
  })
})
