import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import { PaymentLinkCreationSession } from '../constants'
import { SlugifiedString } from '@utils/simplified-account/format/slugify-string'

const SERVICE_EXTERNAL_ID = 'service123abc'
const GATEWAY_ACCOUNT_ID = 117
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'account123abc'
const METADATA_KEY = 'existing_column'

const mockResponse = sinon.spy()

const { nextRequest, call, res, next } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/payment-links/create/metadata/payment-link-update-metadata.controller'
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
    name: 'Test Service',
    externalId: SERVICE_EXTERNAL_ID,
  })
  .withParams({
    metadataKey: METADATA_KEY,
  })
  .build()

describe('controller: services/payment-links/create/metadata/payment-link-update-metadata', () => {
  describe('get', () => {
    describe('with valid metadata key', () => {
      beforeEach(async () => {
        mockResponse.resetHistory()
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Test Payment Link',
          paymentLinkDescription: 'Test Description',
          language: 'en',
          serviceNamePath: 'test-service' as SlugifiedString,
          productNamePath: 'test-payment-link' as SlugifiedString,
          paymentAmountType: 'variable',
          metadata: {
            existing_column: 'a_value',
            another_column: 'another_value',
          },
        }

        nextRequest({
          params: {
            metadataKey: METADATA_KEY,
          },
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
          'simplified-account/services/payment-links/create/metadata'
        )
      })

      it('should set backLink in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.backLink, sinon.match.string)
        sinon.assert.match(context.backLink, sinon.match(/payment-links.*review/))
      })

      it('should set isWelsh to false for English language session', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.isWelsh, false)
      })

      it('should set form values from session in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const formValues = context.formValues as Record<string, unknown>
        sinon.assert.match(formValues.reportingColumn, METADATA_KEY)
        sinon.assert.match(formValues.cellContent, 'a_value')
      })
    })

    describe('with invalid metadata key', () => {
      beforeEach(async () => {
        next.resetHistory()
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Test Payment Link',
          paymentLinkDescription: 'Test Description',
          language: 'en',
          serviceNamePath: 'test-service' as SlugifiedString,
          productNamePath: 'test-payment-link' as SlugifiedString,
          paymentAmountType: 'variable',
          metadata: {
            existing_column: 'a_value',
            another_column: 'another_value',
          },
        }

        nextRequest({
          params: {
            metadataKey: 'invalid_key',
          },
          session: {
            pageData: {
              createPaymentLink: sessionData,
            },
          },
        })

        await call('get')
      })

      it('should call next with NotFoundError', () => {
        sinon.assert.calledOnce(next)
        sinon.assert.calledWith(next, sinon.match.instanceOf(Error))
      })
    })

    describe('with Welsh session data', () => {
      beforeEach(async () => {
        mockResponse.resetHistory()
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Test Payment Link',
          paymentLinkDescription: 'Test Description',
          language: 'cy',
          serviceNamePath: 'test-service' as SlugifiedString,
          productNamePath: 'test-payment-link' as SlugifiedString,
          paymentAmountType: 'variable',
          metadata: {
            existing_column: 'a_value',
            another_column: 'another_value',
          },
        }

        nextRequest({
          params: {
            metadataKey: METADATA_KEY,
          },
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
      beforeEach(async () => {
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
    describe('with valid metadata key and edit action', () => {
      beforeEach(async () => {
        mockResponse.resetHistory()
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Test Payment Link',
          paymentLinkDescription: 'Test Description',
          language: 'en',
          serviceNamePath: 'test-service' as SlugifiedString,
          productNamePath: 'test-payment-link' as SlugifiedString,
          paymentAmountType: 'variable',
          metadata: {
            existing_column: 'a_value',
            another_column: 'another_value',
          },
        }

        nextRequest({
          params: {
            metadataKey: METADATA_KEY,
          },
          session: {
            pageData: {
              createPaymentLink: sessionData,
            },
          },
          body: {
            action: 'edit',
            reportingColumn: 'new_column',
            cellContent: 'new_value',
          },
        })

        await call('post')
      })

      it('should redirect to review page', () => {
        sinon.assert.calledOnce(res.redirect)
        sinon.assert.calledWith(res.redirect, sinon.match(/review/))
      })
    })

    describe('with valid metadata key and delete action', () => {
      beforeEach(async () => {
        mockResponse.resetHistory()
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Test Payment Link',
          paymentLinkDescription: 'Test Description',
          language: 'en',
          serviceNamePath: 'test-service' as SlugifiedString,
          productNamePath: 'test-payment-link' as SlugifiedString,
          paymentAmountType: 'variable',
          metadata: {
            existing_column: 'a_value',
            another_column: 'another_value',
          },
        }

        nextRequest({
          params: {
            metadataKey: METADATA_KEY,
          },
          session: {
            pageData: {
              createPaymentLink: sessionData,
            },
          },
          body: {
            action: 'delete',
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
