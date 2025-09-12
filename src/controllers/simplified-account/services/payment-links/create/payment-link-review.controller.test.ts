import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import GatewayAccount from '@models/gateway-account/GatewayAccount.class'
import { validGatewayAccount } from '@test/fixtures/gateway-account.fixtures'
import { FROM_REVIEW_QUERY_PARAM, PaymentLinkCreationSession } from './constants'
import { CreateProductRequest } from '@models/products/CreateProductRequest.class'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { ProductType } from '@models/products/product-type'

const SERVICE_EXTERNAL_ID = 'service123abc'
const GATEWAY_ACCOUNT_ID = 117
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'account123abc'

const mockResponse = sinon.stub()
const mockCreatePaymentLinkToken = sinon.stub()
const mockCreateProduct = sinon.stub()

const { nextRequest, call, res, req } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/payment-links/create/payment-link-review.controller'
)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/tokens.service': { createPaymentLinkToken: mockCreatePaymentLinkToken },
    '@services/products.service': { createProduct: mockCreateProduct },
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

      beforeEach(async () => {
        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Test Payment Link',
          paymentLinkDescription: 'Test Description',
          language: 'en',
          serviceNamePath: 'mcduck-enterprises',
          productNamePath: 'test-payment-link',
          paymentReferenceType: 'custom',
          paymentReferenceLabel: 'Order Number',
          paymentReferenceHint: 'Enter your order number',
          metadata: {
            existing_column: 'a_value',
            another_column: 'another_value',
          },
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
        sinon.assert.match(context.backLink, sinon.match(/payment-links.*amount/))
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
        sinon.assert.match(context.amountLink, sinon.match(/payment-links.*amount/))
        sinon.assert.match(context.amountLink, sinon.match(expectedQueryStringForChangeLinks))
      })

      it('should set cancelLink in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.cancelLink, sinon.match.string)
        sinon.assert.match(context.cancelLink, sinon.match(/payment-links/))
      })

      it('should set edit metadata link in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const metadata = context.metadata as Record<string, Record<string, string>>
        const updateMetadataLink = metadata.existing_column.link
        sinon.assert.match(
          updateMetadataLink,
          formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.paymentLinks.metadata.update,
            SERVICE_EXTERNAL_ID,
            GatewayAccountType.TEST,
            'existing_column'
          )
        )
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
      beforeEach(async () => {
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

  describe('post', () => {
    describe('with empty session data', () => {
      beforeEach(async () => {
        res.redirect.resetHistory()

        nextRequest({
          session: {},
          user: {
            email: 'test@example.com',
          },
          flash: sinon.stub(),
        })
        await call('post')
      })

      it('should redirect to payment links index', () => {
        sinon.assert.calledOnce(res.redirect)
        sinon.assert.calledWith(res.redirect, sinon.match(/payment-links/))
      })
    })

    describe('when the user confirms the creation of the payment link', () => {
      const mockPaymentLink = {
        name: 'Test Payment Link',
        links: {
          pay: {
            href: 'https://pay-test-link.gov.uk',
          },
        },
      }

      beforeEach(async () => {
        req.flash.resetHistory()
        res.redirect.resetHistory()
        mockCreateProduct.resetHistory()
        mockCreateProduct.resolves(mockPaymentLink)
        mockCreatePaymentLinkToken.resetHistory()
        mockCreatePaymentLinkToken.resolves('big-beautiful-token')

        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Test Payment Link',
          paymentLinkDescription: 'Test Description',
          language: 'en',
          serviceNamePath: 'test-service',
          productNamePath: 'test-payment-link',
          paymentReferenceType: 'custom',
          paymentReferenceLabel: 'Order Number',
          paymentReferenceHint: 'Enter your order number',
          paymentLinkAmount: 1500,
        }

        nextRequest({
          session: {
            pageData: {
              createPaymentLink: sessionData,
            },
          },
          flash: req.flash,
          user: {
            email: 'test@example.com',
          },
          service: {
            name: 'McDuck Enterprises',
            serviceName: { en: 'McDuck Enterprises', cy: 'Mentrau McDuck' },
            externalId: SERVICE_EXTERNAL_ID,
          },
          account: new GatewayAccount(
            validGatewayAccount({
              gateway_account_id: GATEWAY_ACCOUNT_ID,
              external_id: SERVICE_EXTERNAL_ID,
              type: GatewayAccountType.TEST,
            })
          ),
        })

        await call('post')
      })

      it('should call createPaymentLinkToken with correct parameters', () => {
        sinon.assert.calledOnce(mockCreatePaymentLinkToken)

        const expectedUserEmail = 'test@example.com'
        const expectedAccountId = GATEWAY_ACCOUNT_ID
        const expectedServiceId = SERVICE_EXTERNAL_ID
        const expectedAccountType = GatewayAccountType.TEST

        sinon.assert.calledWith(
          mockCreatePaymentLinkToken,
          expectedAccountId,
          expectedServiceId,
          expectedAccountType,
          expectedUserEmail
        )
      })

      it('should call createProduct with correct parameters', () => {
        sinon.assert.calledOnce(mockCreateProduct)

        const expectedCreateProductRequest: CreateProductRequest = new CreateProductRequest()
          .withGatewayAccountId(GATEWAY_ACCOUNT_ID)
          .withServiceNamePath('test-service')
          .withProductNamePath('test-payment-link')
          .withApiToken('big-beautiful-token')
          .withName('Test Payment Link')
          .withLanguage('en')
          .withDescription('Test Description')
          .withPrice(1500)
          .withType(ProductType.ADHOC)
        sinon.assert.calledWith(mockCreateProduct, expectedCreateProductRequest)
      })

      it('should redirect to payment links index after successful creation', () => {
        sinon.assert.calledOnce(res.redirect)
        sinon.assert.calledWith(res.redirect, sinon.match(/payment-links/))
      })

      it('should set success message informing the user about testing the payment link (test service or live service in Sandbox mode)', () => {
        sinon.assert.calledWith(
          req.flash,
          'messages',
          sinon.match({
            state: 'success',
            icon: '&check;',
            heading: 'Test Payment Link has been created',
            body: sinon.match('test your payment link'),
          })
        )
      })
    })

    describe('when the user confirms the creation of the payment link for a live service in normal mode', () => {
      const mockPaymentLink = {
        name: 'Test Payment Link',
        links: {
          pay: {
            href: 'https://pay-test-link.gov.uk',
          },
        },
      }

      beforeEach(async () => {
        req.flash.resetHistory()
        res.redirect.resetHistory()
        mockCreateProduct.resetHistory()
        mockCreateProduct.resolves(mockPaymentLink)
        mockCreatePaymentLinkToken.resetHistory()
        mockCreatePaymentLinkToken.resolves('big-beautiful-token')

        const sessionData: Partial<PaymentLinkCreationSession> = {
          paymentLinkTitle: 'Test Payment Link',
          paymentLinkDescription: 'Test Description',
          language: 'en',
          serviceNamePath: 'test-service',
          productNamePath: 'test-payment-link',
          paymentReferenceType: 'custom',
          paymentReferenceLabel: 'Order Number',
          paymentReferenceHint: 'Enter your order number',
          paymentLinkAmount: 1500,
        }

        nextRequest({
          session: {
            pageData: {
              createPaymentLink: sessionData,
            },
          },
          flash: req.flash,
          user: {
            email: 'test@example.com',
          },
          service: {
            name: 'McDuck Enterprises',
            serviceName: { en: 'McDuck Enterprises', cy: 'Mentrau McDuck' },
            externalId: SERVICE_EXTERNAL_ID,
          },
          account: new GatewayAccount(
            validGatewayAccount({
              gateway_account_id: GATEWAY_ACCOUNT_ID,
              external_id: SERVICE_EXTERNAL_ID,
              type: GatewayAccountType.LIVE,
            })
          ),
        })

        await call('post')
      })

      it('should set success flash message with empty body (live service in normal mode)', () => {
        sinon.assert.calledWith(
          req.flash,
          'messages',
          sinon.match({
            state: 'success',
            icon: '&check;',
            heading: 'Test Payment Link has been created',
            body: '',
          })
        )
      })
    })
  })
})
