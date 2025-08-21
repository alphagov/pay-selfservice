import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import { PaymentLinkCreationSession } from './constants'
import { amount } from '.'

const SERVICE_EXTERNAL_ID = 'service123abc'
const GATEWAY_ACCOUNT_ID = 117
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'account123abc'

const mockResponse = sinon.spy()

const { nextRequest, call, res } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/payment-links/create/payment-link-amount.controller'
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
    externalId: SERVICE_EXTERNAL_ID
  })
  .build()

describe('controller: services/payment-links/create/payment-link-amount', () => {
  describe('get', () => {
    describe('with existing session data', () => {
      before(async () => {
        mockResponse.resetHistory()
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Test Payment Link',
          paymentLinkDescription: 'Test Description',
          language: 'en',
          serviceNamePath: 'mcduck-enterprises',
          productNamePath: 'test-payment-link',
          paymentAmountType: 'fixed',
          paymentLinkAmount: 2499
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
          'simplified-account/services/payment-links/create/amount'
        )
      })

      it('should set form values from session in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const formValues = context.formValues as Record<string, unknown>
        sinon.assert.match(formValues.amountTypeGroup, 'fixed')
        sinon.assert.match(formValues.paymentAmount, 24.99)
      })

      it('should set backLink in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.backLink, sinon.match.string)
        sinon.assert.match(context.backLink, sinon.match(/payment-links.*reference/))
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
          paymentAmountType: 'variable',
          paymentAmountHint: 'whatever',
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

      it('should set form values for variable amount', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const formValues = context.formValues as Record<string, unknown>
        sinon.assert.match(formValues.amountTypeGroup, 'variable')
        sinon.assert.match(formValues.amountHint, 'whatever')
        sinon.assert.match(formValues.paymentAmount, undefined)
      })
    })


    describe('with empty session data', () => {
      before(async () => {
        res.redirect.resetHistory()

        nextRequest({
          session: {},
          body: {},
        })

        await call('get')
      })

      it('should redirect to payment links index', () => {
        sinon.assert.calledOnce(res.redirect)
        sinon.assert.calledWith(res.redirect, sinon.match(/payment-links/))
      })
    })
  })

  describe('post', () => {
    describe('with fixed amount type', () => {
      before(async () => {
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Test Payment Link',
          language: 'en',
          serviceNamePath: 'test-service',
          productNamePath: 'test-payment-link',
          paymentAmountType: 'variable',
          paymentAmountHint: 'whatever',
        }

        res.redirect.resetHistory()

        nextRequest({
          session: {
            pageData: {
              createPaymentLink: sessionData,
            },
          },
          body: {
            amountTypeGroup: 'fixed',
            paymentAmount: '24.99',
          },
        })

        await call('post')
      })

      it('should redirect to review page', () => {
        sinon.assert.calledOnce(res.redirect)
        sinon.assert.calledWith(res.redirect, sinon.match(/review/))
      })
    })

    describe('with variable amount type', () => {
      before(async () => {
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Test Payment Link',
          language: 'en',
          serviceNamePath: 'test-service',
          productNamePath: 'test-payment-link',
          paymentAmountType: 'fixed',
          paymentLinkAmount: 1299,
        }

        res.redirect.resetHistory()

        nextRequest({
          session: {
            pageData: {
              createPaymentLink: sessionData,
            },
          },
          body: {
            amountTypeGroup: 'variable',
            amountHint: 'whatever',
          },
        })

        await call('post')
      })

      it('should redirect to review page', () => {
        sinon.assert.calledOnce(res.redirect)
        sinon.assert.calledWith(res.redirect, sinon.match(/review/))
      })
    })
  })
})