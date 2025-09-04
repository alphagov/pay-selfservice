import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import GatewayAccountType, { TEST } from '@models/gateway-account/gateway-account-type'
import GatewayAccount from '@models/gateway-account/GatewayAccount.class'
import { validGatewayAccount } from '@test/fixtures/gateway-account.fixtures'
import { PaymentLinkCreationSession, FROM_REVIEW_QUERY_PARAM } from './constants'
import goLiveStage from '@models/constants/go-live-stage'
import PaymentProviders from '@models/constants/payment-providers'

const SERVICE_EXTERNAL_ID = 'service123abc'
const GATEWAY_ACCOUNT_ID = 117
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'account123abc'

const mockResponse = sinon.stub()

const { nextRequest, call, res } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/payment-links/create/payment-link-information.controller'
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

describe('controller: services/payment-links/create/payment-link-information', () => {
  describe('get', () => {
    describe('with no existing session data', () => {
      beforeEach(async () => {
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
          'simplified-account/services/payment-links/create/index'
        )
      })

      it('should set empty form values in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const formValues = context.formValues as { name: string; description: string }
        sinon.assert.match(formValues.name, '')
        sinon.assert.match(formValues.description, '')
      })

      it('should set service name and isWelsh to false by default', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.serviceName, 'McDuck Enterprises')
        sinon.assert.match(context.isWelsh, false)
      })

      it('should set backLink in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.backLink, sinon.match.string)
        sinon.assert.match(context.backLink, sinon.match(/payment-links/))
      })

      it('should set createJourney in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.createJourney, true)
      })
    })

    describe('with existing session data', () => {
      beforeEach(async () => {
        mockResponse.resetHistory()
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Existing Title',
          paymentLinkDescription: 'Existing Description',
          language: 'en',
          serviceNamePath: 'test-service',
          productNamePath: 'existing-title',
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

      it('should populate form values from session', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const formValues = context.formValues as { name: string; description: string }
        sinon.assert.match(formValues.name, 'Existing Title')
        sinon.assert.match(formValues.description, 'Existing Description')
      })
    })

    describe('with Welsh language selected in session', () => {
      beforeEach(async () => {
        mockResponse.resetHistory()
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Welsh Title',
          language: 'cy',
          serviceNamePath: 'test-service',
          productNamePath: 'welsh-title',
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

      it('should set isWelsh to true and use Welsh service name', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.isWelsh, true)
        sinon.assert.match(context.serviceName, 'Mentrau McDuck')
      })
    })

    describe('with Welsh language query parameter', () => {
      beforeEach(async () => {
        mockResponse.resetHistory()
        nextRequest({
          query: { language: 'cy' },
        })

        await call('get')
      })

      it('should set isWelsh to true', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.isWelsh, true)
        sinon.assert.match(context.serviceName, 'Mentrau McDuck')
      })
    })

    describe('for Welsh payment links on live account and no Welsh service name', () => {
      beforeEach(async () => {
        mockResponse.resetHistory()
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Welsh Title',
          language: 'cy',
          serviceNamePath: 'test-service',
          productNamePath: 'welsh-title',
        }

        nextRequest({
            service: {
            name: 'English Service',
            serviceName: { en: 'English Service', cy: null },
            currentGoLiveStage: goLiveStage.LIVE
          },
          account: new GatewayAccount(
            validGatewayAccount({
              gateway_account_id: GATEWAY_ACCOUNT_ID,
              external_id: SERVICE_EXTERNAL_ID,
              type: TEST,
              payment_provider: PaymentProviders.WORLDPAY,
              })
            ),
          session: {
            pageData: {
              createPaymentLink: sessionData,
            },
          },
        })

        await call('get')
      })

      it('should redirect to service name edit page with Welsh and payment link creation query parameters set', () => {
          sinon.assert.calledOnce(res.redirect)
          sinon.assert.calledWith(
            res.redirect,
            sinon.match(/settings.*service-name.*edit/)
          )
          sinon.assert.calledWith(
            res.redirect,
            sinon.match(/cy=true/)
          )
          sinon.assert.calledWith(
            res.redirect,
            sinon.match(/fromPaymentLinkCreation=true/)
          )
        })
    })

    describe('for Welsh payment links on test account and no Welsh service name', () => {
      beforeEach(async () => {
        mockResponse.resetHistory()
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Welsh Title',
          language: 'cy',
          serviceNamePath: 'test-service',
          productNamePath: 'welsh-title',
        }

        nextRequest({
          service: {
            name: 'English Service',
            serviceName: { en: 'English Service', cy: null },
            currentGoLiveStage: goLiveStage.NOT_STARTED
          },
          account: new GatewayAccount(
            validGatewayAccount({
              gateway_account_id: GATEWAY_ACCOUNT_ID,
              external_id: SERVICE_EXTERNAL_ID,
              type: TEST,
              payment_provider: PaymentProviders.SANDBOX,
              })
            ),
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
          'simplified-account/services/payment-links/create/index'
        )
      })

      it('should set isWelsh to true but use the English service name', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.isWelsh, true)
        sinon.assert.match(context.serviceName, 'English Service')
      })
    })

    describe('for Welsh payment links on sandbox account and no Welsh service name', () => {
      beforeEach(async () => {
        mockResponse.resetHistory()
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Welsh Title',
          language: 'cy',
          serviceNamePath: 'test-service',
          productNamePath: 'welsh-title',
        }

        nextRequest({
          service: {
            name: 'English Service',
            serviceName: { en: 'English Service', cy: null },
            currentGoLiveStage: goLiveStage.LIVE
          },
          account: new GatewayAccount(
            validGatewayAccount({
              gateway_account_id: GATEWAY_ACCOUNT_ID,
              external_id: SERVICE_EXTERNAL_ID,
              type: TEST,
              payment_provider: PaymentProviders.SANDBOX,
              })
            ),
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
          'simplified-account/services/payment-links/create/index'
        )
      })

      it('should set isWelsh to true but use the English service name', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.isWelsh, true)
        sinon.assert.match(context.serviceName, 'English Service')
      })
    })
  })

  describe('post', () => {
    describe('with valid form data', () => {
      beforeEach(async () => {
        res.redirect.resetHistory()

        nextRequest({
          body: {
            name: 'Test Payment Link',
            description: 'Test Description',
          },
        })

        await call('post')
      })

      it('should redirect to reference page', () => {
        sinon.assert.calledOnce(res.redirect)
        sinon.assert.calledWith(res.redirect, sinon.match(/payment-links.*reference/))
      })
    })

    describe('with Welsh language parameter', () => {
      beforeEach(async () => {
        res.redirect.resetHistory()

        nextRequest({
          query: { language: 'cy' },
          body: {
            name: 'Welsh Payment Link',
            description: 'Welsh Description',
          },
        })

        await call('post')
      })

      it('should redirect to reference page', () => {
        sinon.assert.calledOnce(res.redirect)
        sinon.assert.calledWith(res.redirect, sinon.match(/payment-links.*reference/))
      })
    })

    describe('with Welsh language already saved in the session (user came back with Back link)', () => {
      let sessionLanguage: string

      beforeEach(async () => {
        res.redirect.resetHistory()
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Previous Title',
          language: 'cy',
          serviceNamePath: 'test-service',
          productNamePath: 'previous-title',
      }

      nextRequest({
        session: {
          pageData: {
            createPaymentLink: sessionData,
          },
        },
        body: {
          name: 'Welsh Payment Link',
          description: 'Welsh Description',
        },
      })

      const result = await call('post')
      const thisRequest = result.req as Record<string, unknown>
      const session = thisRequest.session as { pageData: { createPaymentLink: { language: string } } }
      sessionLanguage = session.pageData.createPaymentLink.language
    })

    it('should retain Welsh language from session and redirect', () => {
      sinon.assert.calledOnce(res.redirect)
      sinon.assert.calledWith(res.redirect, sinon.match(/payment-links.*reference/))
      sinon.assert.match(sessionLanguage, 'cy')
    })
  })

    describe('when the user is coming back from the review page (FROM_REVIEW_QUERY_PARAM set to true)', () => {
      beforeEach(async () => {
        res.redirect.resetHistory()

        nextRequest({
          query: { [FROM_REVIEW_QUERY_PARAM]: 'true' },
          body: {
            name: 'Test Payment Link',
            description: 'Test Description',
          },
        })

        await call('post')
      })

      it('should redirect back to review page', () => {
        sinon.assert.calledOnce(res.redirect)
        sinon.assert.calledWith(res.redirect, sinon.match(/payment-links.*review/))
      })
    })

    describe('with validation errors - empty title', () => {
      beforeEach(async () => {
        mockResponse.resetHistory()
        res.redirect.resetHistory()

        nextRequest({
          body: {
            name: '',
            description: 'Valid Description',
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
          'simplified-account/services/payment-links/create/index'
        )
      })

      it('should include errors in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.errors, sinon.match.object)
        sinon.assert.match(context.errors, sinon.match.has('summary'))
        sinon.assert.match(context.errors, sinon.match.has('formErrors'))
      })

      it('should include form values in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const formValues = context.formValues as { name: string; description: string }
        sinon.assert.match(formValues.name, '')
        sinon.assert.match(formValues.description, 'Valid Description')
      })

      it('should set createJourney in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.createJourney, true)
      })

      it('should not redirect', () => {
        sinon.assert.notCalled(res.redirect)
      })
    })

    describe('with validation errors - title too long', () => {
      beforeEach(async () => {
        const longTitle = 'a'.repeat(231)
        mockResponse.resetHistory()
        res.redirect.resetHistory()

        nextRequest({
          body: {
            name: longTitle,
            description: 'Valid Description',
          },
        })

        await call('post')
      })

      it('should render form with validation errors', () => {
        sinon.assert.calledOnce(mockResponse)
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.notCalled(res.redirect)
        sinon.assert.match(context.errors, sinon.match.object)
        sinon.assert.match(context.errors, sinon.match.has('summary'))
        sinon.assert.match(context.errors, sinon.match.has('formErrors'))
      })
    })

    describe('with validation errors - description with invalid characters', () => {
      beforeEach(async () => {
        mockResponse.resetHistory()
        res.redirect.resetHistory()

        nextRequest({
          body: {
            name: 'Valid Title',
            description: 'Description with < invalid characters >',
          },
        })

        await call('post')
      })

      it('should render form with validation errors', () => {
        sinon.assert.calledOnce(mockResponse)
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.notCalled(res.redirect)
        sinon.assert.match(context.errors, sinon.match.object)
        sinon.assert.match(context.errors, sinon.match.has('summary'))
        sinon.assert.match(context.errors, sinon.match.has('formErrors'))
      })
    })

    describe('with validation errors - description too long', () => {
      beforeEach(async () => {
        const longDescription = 'a'.repeat(5001)
        mockResponse.resetHistory()
        res.redirect.resetHistory()

        nextRequest({
          body: {
            name: 'Valid Title',
            description: longDescription,
          },
        })

        await call('post')
      })

      it('should render form with validation errors', () => {
        sinon.assert.calledOnce(mockResponse)
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.notCalled(res.redirect)
        sinon.assert.match(context.errors, sinon.match.object)
        sinon.assert.match(context.errors, sinon.match.has('summary'))
        sinon.assert.match(context.errors, sinon.match.has('formErrors'))
      })
    })
  })
})
