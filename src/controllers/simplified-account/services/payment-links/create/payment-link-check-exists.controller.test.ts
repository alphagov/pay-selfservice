import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import { PaymentLinkCreationSession } from '@controllers/simplified-account/services/payment-links/create/constants'

const SERVICE_EXTERNAL_ID = 'service123abc'
const GATEWAY_ACCOUNT_ID = 117
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'account123abc'

const mockResponse = sinon.stub()

const { nextRequest, call, res } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/payment-links/create/payment-link-check-exists.controller'
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

describe('controller: services/payment-links/existing/check-payment-link-exists', () => {
  describe('get', () => {
    describe('with valid session data', () => {
      beforeEach(async () => {
        mockResponse.resetHistory()
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'My Link',
          productNamePath: 'my-link',
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

      it('should pass correct template path', () => {
        sinon.assert.calledWith(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/services/payment-links/create/check-payment-link'
        )
      })

      it('should set form values from session', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const formValues = context.formValues as { link: string }
        sinon.assert.match(formValues, { paymentLink: 'My Link' })
      })
    })

    describe('with service missing name', () => {
      beforeEach(async () => {
        mockResponse.resetHistory()
        nextRequest({
          service: {
            externalId: SERVICE_EXTERNAL_ID,
            gatewayAccountIds: ['acc1'],
            serviceName: { cy: 'Mentrau McDuck' },
          },
          session: {
            pageData: {
              createPaymentLink: {
                paymentLinkTitle: 'No Name Link',
                productNamePath: 'no-name-link',
              },
            },
          },
        })
        await call('get')
      })

      it('should render with a fallback service name', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.service, 'McDuck Enterprises')
      })
    })

    describe('with Welsh language selected', () => {
      beforeEach(async () => {
        mockResponse.resetHistory()
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Welsh Link',
          productNamePath: 'welsh-link',
        }
        nextRequest({
          session: {
            pageData: {
              createPaymentLink: sessionData,
            },
          },
          query: { language: 'cy' },
        })
        await call('get')
      })

      it('should set isWelsh to true and use Welsh service name', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.isWelsh, true)
        sinon.assert.match(context.service, 'Mentrau McDuck')
      })
    })

    describe('with missing session data', () => {
      beforeEach(async () => {
        mockResponse.resetHistory()
        nextRequest({
          session: {},
        })
        await call('get')
      })

      it('should redirect to index', () => {
        sinon.assert.calledOnce(res.redirect)
        sinon.assert.calledWith(res.redirect, sinon.match(/payment-links/))
      })
    })
    describe('with unexpected account type', () => {
      beforeEach(async () => {
        mockResponse.resetHistory()
        nextRequest({
          account: {
            id: GATEWAY_ACCOUNT_ID,
            externalId: GATEWAY_ACCOUNT_EXTERNAL_ID,
            type: 'UNKNOWN_TYPE',
          },
          session: {
            pageData: {
              createPaymentLink: {
                paymentLinkTitle: 'Edge Link',
                productNamePath: 'edge-link',
              },
            },
          },
        })
        await call('get')
      })

      it('should not throw and render the page', () => {
        sinon.assert.calledOnce(mockResponse)
        sinon.assert.calledWith(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/services/payment-links/create/check-payment-link'
        )
      })
    })

    describe('with malformed session data', () => {
      beforeEach(async () => {
        mockResponse.resetHistory()
        nextRequest({
          session: {
            pageData: {
              // createPaymentLink is missing required fields
              createPaymentLink: {},
            },
          },
        })
        await call('get')
      })

      it('should redirect to index', () => {
        sinon.assert.calledOnce(res.redirect)
        sinon.assert.calledWith(res.redirect, sinon.match(/payment-links/))
      })
    })
  })

  describe('post', () => {
    describe('with valid form data', () => {
      beforeEach(async () => {
        res.redirect.resetHistory()
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Valid Link',
          productNamePath: 'valid-link',
          serviceNamePath: 'Valid Service Link',
        }
        nextRequest({
          session: {
            pageData: {
              createPaymentLink: sessionData,
            },
          },
          body: {
            paymentLink: 'Valid Link',
          },
        })
        await call('post')
      })

      it('should redirect to reference page', () => {
        sinon.assert.calledOnce(res.redirect)
        sinon.assert.calledWith(res.redirect, sinon.match(/payment-links.*reference/))
      })
    })

    describe('with validation errors (empty link)', () => {
      beforeEach(async () => {
        mockResponse.resetHistory()
        res.redirect.resetHistory()
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: '',
          productNamePath: '',
        }
        nextRequest({
          session: {
            pageData: {
              createPaymentLink: sessionData,
            },
          },
          body: {
            paymentLink: '',
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
          'simplified-account/services/payment-links/create/check-payment-link'
        )
      })

      it('should not redirect', () => {
        sinon.assert.notCalled(res.redirect)
      })
    })

    describe('with missing session data', () => {
      beforeEach(async () => {
        res.redirect.resetHistory()
        nextRequest({
          session: {},
          body: {
            paymentLink: 'Any Link',
          },
        })
        await call('post')
      })

      it('should redirect to index', () => {
        sinon.assert.calledOnce(res.redirect)
        sinon.assert.calledWith(res.redirect, sinon.match(/payment-links/))
      })
    })
    describe('with unexpected account type', () => {
      beforeEach(async () => {
        res.redirect.resetHistory()
        nextRequest({
          account: {
            id: GATEWAY_ACCOUNT_ID,
            externalId: GATEWAY_ACCOUNT_EXTERNAL_ID,
            type: 'UNKNOWN_TYPE',
          },
          session: {
            pageData: {
              createPaymentLink: {
                paymentLinkTitle: 'Edge Link',
                productNamePath: 'edge-link',
              },
            },
          },
          body: {
            paymentLink: 'Edge Link',
          },
        })
        await call('post')
      })

      it('should not throw and redirect to reference page', () => {
        sinon.assert.calledOnce(res.redirect)
        sinon.assert.calledWith(res.redirect, sinon.match(/payment-links.*reference/))
      })
    })

    describe('with malformed session data', () => {
      beforeEach(async () => {
        res.redirect.resetHistory()
        nextRequest({
          session: {
            pageData: {
              // createPaymentLink is missing required fields
              createPaymentLink: {},
            },
          },
          body: {
            paymentLink: 'Malformed Link',
          },
        })
        await call('post')
      })

      it('should redirect to index', () => {
        sinon.assert.calledOnce(res.redirect)
        sinon.assert.calledWith(res.redirect, sinon.match(/payment-links/))
      })
    })

    describe('with PRODUCTS_FRIENDLY_BASE_URI unset', () => {
      let originalEnv: string | undefined
      beforeEach(async () => {
        res.redirect.resetHistory()
        originalEnv = process.env.PRODUCTS_FRIENDLY_BASE_URI
        delete process.env.PRODUCTS_FRIENDLY_BASE_URI
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'No Env Link',
          productNamePath: 'no-env-link',
        }
        nextRequest({
          session: {
            pageData: {
              createPaymentLink: sessionData,
            },
          },
          body: {
            paymentLink: 'No Env Link',
          },
        })
        await call('post')
      })
      afterEach(() => {
        process.env.PRODUCTS_FRIENDLY_BASE_URI = originalEnv
      })

      it('should not throw and redirect to reference page', () => {
        sinon.assert.calledOnce(res.redirect)
        sinon.assert.calledWith(res.redirect, sinon.match(/payment-links.*reference/))
      })
    })
  })
})
