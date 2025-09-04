import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import { PaymentLinkCreationSession } from '.././constants'

const SERVICE_EXTERNAL_ID = 'service123abc'
const GATEWAY_ACCOUNT_ID = 117
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'account123abc'

const mockResponse = sinon.spy()

const { nextRequest, call, res } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/payment-links/create/metadata/payment-link-metadata.controller'
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

describe('controller: services/payment-links/create/metadata/payment-link-metadata', () => {
  describe('get', () => {
    describe('with existing session data', () => {
      beforeEach(async () => {
        mockResponse.resetHistory()
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Test Payment Link',
          paymentLinkDescription: 'Test Description',
          language: 'en',
          serviceNamePath: 'test-service',
          productNamePath: 'test-payment-link',
          paymentAmountType: 'variable',
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
          'simplified-account/services/payment-links/create/metadata'
        )
      })

      it('should set backLink in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.backLink, sinon.match.string)
        sinon.assert.match(context.backLink, sinon.match(/payment-links.*review/))
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
      beforeEach(async () => {
        mockResponse.resetHistory()
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Welsh Payment Link',
          language: 'cy',
          serviceNamePath: 'test-service',
          productNamePath: 'welsh-payment-link',
          paymentAmountType: 'variable',
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
    describe('with valid form values', () => {
      beforeEach(async () => {
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Test Payment Link',
          paymentLinkDescription: 'Test Description',
          language: 'en',
          serviceNamePath: 'test-service',
          productNamePath: 'test-payment-link',
          paymentAmountType: 'variable',
        }

        res.redirect.resetHistory()

        nextRequest({
          session: {
            pageData: {
              createPaymentLink: sessionData,
            },
          },
          body: {
            reportingColumn: 'a_column',
            cellContent: 'a_value',
          },
        })

        await call('post')
      })

      it('should redirect to review page', () => {
        sinon.assert.calledOnce(res.redirect)
        sinon.assert.calledWith(res.redirect, sinon.match(/review/))
      })
    })

    describe('with empty form', () => {
      beforeEach(async () => {
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Test Payment Link',
          language: 'en',
          serviceNamePath: 'test-service',
          productNamePath: 'test-payment-link',
          paymentAmountType: 'variable',
        }

        mockResponse.resetHistory()
        res.redirect.resetHistory()

        nextRequest({
          session: {
            pageData: {
              createPaymentLink: sessionData,
            },
          },
          body: {},
        })

        await call('post')
      })

      it('should render the form with errors', () => {
        sinon.assert.calledOnce(mockResponse)
        sinon.assert.calledWith(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/services/payment-links/create/metadata'
        )
      })

      it('should include errors in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.errors, sinon.match.object)
        sinon.assert.match(context.errors, sinon.match.has('summary'))
        sinon.assert.match(context.errors, sinon.match.has('formErrors'))
      })

      it('should not redirect', () => {
        sinon.assert.notCalled(res.redirect)
      })
    })

    describe('without reporting column', () => {
      beforeEach(async () => {
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Test Payment Link',
          language: 'en',
          serviceNamePath: 'test-service',
          productNamePath: 'test-payment-link',
          paymentAmountType: 'variable',
        }

        mockResponse.resetHistory()
        res.redirect.resetHistory()

        nextRequest({
          session: {
            pageData: {
              createPaymentLink: sessionData,
            },
          },
          body: {
            cellContent: 'a_value',
          },
        })

        await call('post')
      })

      it('should render the form with errors', () => {
        sinon.assert.calledOnce(mockResponse)
        sinon.assert.calledWith(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/services/payment-links/create/metadata'
        )
      })

      it('should include errors in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.errors, sinon.match.object)
        sinon.assert.match(context.errors, sinon.match.has('summary'))
        sinon.assert.match(context.errors, sinon.match.has('formErrors'))
      })

      it('should not redirect', () => {
        sinon.assert.notCalled(res.redirect)
      })
    })

    describe('without cell content', () => {
      beforeEach(async () => {
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Test Payment Link',
          language: 'en',
          serviceNamePath: 'test-service',
          productNamePath: 'test-payment-link',
          paymentAmountType: 'variable',
        }

        mockResponse.resetHistory()
        res.redirect.resetHistory()

        nextRequest({
          session: {
            pageData: {
              createPaymentLink: sessionData,
            },
          },
          body: {
            reportingColumn: 'a_column',
          },
        })

        await call('post')
      })

      it('should render the form with errors', () => {
        sinon.assert.calledOnce(mockResponse)
        sinon.assert.calledWith(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/services/payment-links/create/metadata'
        )
      })

      it('should include errors in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.errors, sinon.match.object)
        sinon.assert.match(context.errors, sinon.match.has('summary'))
        sinon.assert.match(context.errors, sinon.match.has('formErrors'))
      })

      it('should not redirect', () => {
        sinon.assert.notCalled(res.redirect)
      })
    })

    describe('with reporting column too long', () => {
      beforeEach(async () => {
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Test Payment Link',
          language: 'en',
          serviceNamePath: 'test-service',
          productNamePath: 'test-payment-link',
          paymentAmountType: 'variable',
        }

        const characterLimit = 30
        const invalidColumnName = 'a'.repeat(characterLimit + 1)

        mockResponse.resetHistory()
        res.redirect.resetHistory()

        nextRequest({
          session: {
            pageData: {
              createPaymentLink: sessionData,
            },
          },
          body: {
            reportingColumn: invalidColumnName,
            cellContent: 'a_value',
          },
        })

        await call('post')
      })

      it('should render the form with errors', () => {
        sinon.assert.calledOnce(mockResponse)
        sinon.assert.calledWith(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/services/payment-links/create/metadata'
        )
      })

      it('should include errors in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.errors, sinon.match.object)
        sinon.assert.match(context.errors, sinon.match.has('summary'))
        sinon.assert.match(context.errors, sinon.match.has('formErrors'))
      })

      it('should not redirect', () => {
        sinon.assert.notCalled(res.redirect)
      })
    })

    describe('with cell content too long', () => {
      beforeEach(async () => {
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Test Payment Link',
          language: 'en',
          serviceNamePath: 'test-service',
          productNamePath: 'test-payment-link',
          paymentAmountType: 'variable',
        }

        const characterLimit = 100
        const invalidCellContent = 'a'.repeat(characterLimit + 1)

        mockResponse.resetHistory()
        res.redirect.resetHistory()

        nextRequest({
          session: {
            pageData: {
              createPaymentLink: sessionData,
            },
          },
          body: {
            reportingColumn: 'a_column',
            cellContent: invalidCellContent,
          },
        })

        await call('post')
      })

      it('should render the form with errors', () => {
        sinon.assert.calledOnce(mockResponse)
        sinon.assert.calledWith(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/services/payment-links/create/metadata'
        )
      })

      it('should include errors in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.errors, sinon.match.object)
        sinon.assert.match(context.errors, sinon.match.has('summary'))
        sinon.assert.match(context.errors, sinon.match.has('formErrors'))
      })

      it('should not redirect', () => {
        sinon.assert.notCalled(res.redirect)
      })
    })

    describe('with duplicate reporting column', () => {
      beforeEach(async () => {
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Test Payment Link',
          language: 'en',
          serviceNamePath: 'test-service',
          productNamePath: 'test-payment-link',
          paymentAmountType: 'variable',
          metadata: { 'existing_column': 'existing_value' }
        }

        mockResponse.resetHistory()
        res.redirect.resetHistory()

        nextRequest({
          session: {
            pageData: {
              createPaymentLink: sessionData,
            },
          },
          body: {
            reportingColumn: 'existing_column',
            cellContent: 'some_new_value',
          },
        })

        await call('post')
      })

      it('should render the form with errors', () => {
        sinon.assert.calledOnce(mockResponse)
        sinon.assert.calledWith(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/services/payment-links/create/metadata'
        )
      })

      it('should include errors in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.errors, sinon.match.object)
        sinon.assert.match(context.errors, sinon.match.has('summary'))
        sinon.assert.match(context.errors, sinon.match.has('formErrors'))
      })

      it('should not redirect', () => {
        sinon.assert.notCalled(res.redirect)
      })
    })


    describe('with cell content too long', () => {
      beforeEach(async () => {
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Test Payment Link',
          language: 'en',
          serviceNamePath: 'test-service',
          productNamePath: 'test-payment-link',
          paymentAmountType: 'variable',
        }

        const characterLimit = 100
        const invalidCellContent = 'a'.repeat(characterLimit + 1)

        mockResponse.resetHistory()
        res.redirect.resetHistory()

        nextRequest({
          session: {
            pageData: {
              createPaymentLink: sessionData,
            },
          },
          body: {
            reportingColumn: 'a_column',
            cellContent: invalidCellContent,
          },
        })

        await call('post')
      })

      it('should render the form with errors', () => {
        sinon.assert.calledOnce(mockResponse)
        sinon.assert.calledWith(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/services/payment-links/create/metadata'
        )
      })

      it('should include errors in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.errors, sinon.match.object)
        sinon.assert.match(context.errors, sinon.match.has('summary'))
        sinon.assert.match(context.errors, sinon.match.has('formErrors'))
      })

      it('should not redirect', () => {
        sinon.assert.notCalled(res.redirect)
      })
    })

    describe('with too many reporting columns', () => {
      beforeEach(async () => {
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Test Payment Link',
          language: 'en',
          serviceNamePath: 'test-service',
          productNamePath: 'test-payment-link',
          paymentAmountType: 'variable',
          metadata: {},
        }

        const maximumColumns = 15
        sessionData.metadata ??= {};
        
        for (let i = 1; i <= maximumColumns; i++) {
          const columnName = `existing_column_${i}`;
          sessionData.metadata[columnName] = 'existing value';
        }

        mockResponse.resetHistory()
        res.redirect.resetHistory()

        nextRequest({
          session: {
            pageData: {
              createPaymentLink: sessionData,
            },
          },
          body: {
            reportingColumn: 'new_column',
            cellContent: 'some_new_value',
          },
        })

        await call('post')
      })

      it('should render the form with errors', () => {
        sinon.assert.calledOnce(mockResponse)
        sinon.assert.calledWith(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/services/payment-links/create/metadata'
        )
      })

      it('should include errors in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.errors, sinon.match.object)
        sinon.assert.match(context.errors, sinon.match.has('summary'))
        sinon.assert.match(context.errors, sinon.match.has('formErrors'))
      })

      it('should not redirect', () => {
        sinon.assert.notCalled(res.redirect)
      })
    })
  })
})