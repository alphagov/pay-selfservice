import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import { FROM_REVIEW_QUERY_PARAM, PaymentLinkCreationSession } from './constants'

const SERVICE_EXTERNAL_ID = 'service123abc'
const GATEWAY_ACCOUNT_ID = 117
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'account123abc'

const mockResponse = sinon.spy()

const { nextRequest, call, res } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/payment-links/create/payment-link-review.controller'
)
  .withStubs({
    '@utils/response': { response: mockResponse },
  })
  .withAccount({
    id: GATEWAY_ACCOUNT_ID,
    externalId: GATEWAY_ACCOUNT_EXTERNAL_ID,
    type: GatewayAccountType.TEST,
  })
  .withService({
    name: 'McDuck Enterprises',
    serviceName: { en: 'McDuck Enterprises', cy: 'Mentrau McDuck' },
    externalId: SERVICE_EXTERNAL_ID,
  })
  .build()

describe('controller: services/payment-links/create/payment-link-review', () => {
  describe('get', () => {
    describe('with valid session data', () => {
      const expectedQueryStringForChangeLinks = FROM_REVIEW_QUERY_PARAM + '=true'

      before(async () => {
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Test Payment Link',
          paymentLinkDescription: 'Test Description',
          language: 'en',
          serviceNamePath: 'mcduck-enterprises',
          productNamePath: 'test-payment-link',
          paymentReferenceType: 'custom',
          paymentReferenceLabel: 'Order Number',
          paymentReferenceHint: 'Enter your order number',
        }

        nextRequest({
          session: {
            pageData: {
              createPaymentLink: sessionData,
            },
          },
        })

        await call('get')
      })

      it('should call the response method', () => {
        sinon.assert.calledOnce(mockResponse)
      })

      it('should pass correct template path to the response method', () => {
        sinon.assert.calledWith(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/services/payment-links/create/review'
        )
      })

      it('should set backLink in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.backLink, sinon.match.string)
        sinon.assert.match(context.backLink, sinon.match(/payment-links.*reference/))
      })

      it('should set titleLink in context with fromReview query parameter', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.titleLink, sinon.match.string)
        sinon.assert.match(context.titleLink, sinon.match(/payment-links.*create/))
        sinon.assert.match(context.titleLink, sinon.match(expectedQueryStringForChangeLinks))
      })

      it('should set referenceLink in context with fromReview query parameter', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.referenceLink, sinon.match.string)
        sinon.assert.match(context.referenceLink, sinon.match(/payment-links.*reference/))
        sinon.assert.match(context.referenceLink, sinon.match(expectedQueryStringForChangeLinks))
      })

      it('should set amountLink in context with fromReview query parameter', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.amountLink, sinon.match.string)
        sinon.assert.match(context.amountLink, sinon.match(/payment-links.*review/))
        sinon.assert.match(context.amountLink, sinon.match(expectedQueryStringForChangeLinks))
      })

      it('should set cancelLink in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.cancelLink, sinon.match.string)
        sinon.assert.match(context.cancelLink, sinon.match(/payment-links/))
      })

      it('should set createJourney in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.createJourney, true)
      })

      it('should set isWelsh to false for English language session', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.isWelsh, false)
      })
    })

    describe('with Welsh session data', () => {
      before(async () => {
        mockResponse.resetHistory()
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Welsh Payment Link',
          language: 'cy',
          serviceNamePath: 'test-service',
          productNamePath: 'welsh-payment-link',
          paymentReferenceType: 'standard',
          paymentReferenceLabel: 'Reference',
        }

        nextRequest({
          session: {
            pageData: {
              createPaymentLink: sessionData,
            },
          },
        })

        await call('get')
      })

      it('should set isWelsh to true for Welsh session', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.isWelsh, true)
      })
    })

    describe('with empty session data', () => {
      before(async () => {
        res.redirect.resetHistory()

        nextRequest({
          session: {},
        })

        await call('get')
      })

      it('should redirect to payment links index', () => {
        sinon.assert.calledOnce(res.redirect)
        sinon.assert.calledWith(res.redirect, sinon.match(/payment-links/))
      })
    })
  })

  // describe('post', () => {
  // })
})
