import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import { expect } from 'chai'

const SERVICE_NAME = 'Test Service'
const SERVICE_EXTERNAL_ID = 'service-123-def'
const PRODUCT_EXTERNAL_ID = 'product-123-def'
const ACCOUNT_ID = 24

const mockResponse = sinon.spy()
const mockRedirect = sinon.spy()
const mockGetProductByExternalId = sinon.stub()
const mockProductsClientDelete = sinon.stub()
const mockLogger = {
  error: sinon.stub(),
  warn: sinon.stub(),
  info: sinon.stub(),
}

const mockPaymentLink = {
  externalId: PRODUCT_EXTERNAL_ID,
  name: 'Test Payment Link',
  description: 'Test description',
  price: 1000,
  referenceEnabled: true,
  referenceLabel: 'Test Reference',
}
interface ValidationError {
  summary: { href: string; text: string }[]
}
interface SessionData {
  pageData?: {
    deleteSuccess?: {
      type: string
      id: string
    }
    deleteError?: {
      type: string
      id: string
      message: string
    }
    [key: string]: unknown
  }
  [key: string]: unknown
}

const { req, res, nextRequest, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/payment-links/delete/delete-payment-link.controller'
)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/products.service': { getProductByExternalId: mockGetProductByExternalId },
    '@services/clients/pay/ProductsClient.class': function () {
      this.products = {
        delete: mockProductsClientDelete,
      }
    },
    '@utils/currency-formatter': { penceToPoundsWithCurrency: (price: number) => `£${(price / 100).toFixed(2)}` },
    '@utils/simplified-account/format/format-service-and-account-paths-for': sinon.stub().returns('/test-path'),
    '@root/paths': {
      simplifiedAccount: {
        paymentLinks: {
          index: '/payment-links',
          delete: '/payment-links/:productExternalId/delete',
        },
      },
    },
    '@utils/logger': sinon.stub().returns(mockLogger),
  })
  .build()

describe('controller: services/payment-links/delete', () => {
  beforeEach(() => {
    mockResponse.resetHistory()
    mockRedirect.resetHistory()
    mockGetProductByExternalId.reset()
    mockProductsClientDelete.reset()
    mockLogger.error.resetHistory()
    mockLogger.warn.resetHistory()
    mockLogger.info.resetHistory()
  })

  describe('get', () => {
    describe('when payment link exists', () => {
      before(async () => {
        mockGetProductByExternalId.resolves(mockPaymentLink)
        nextRequest({
          params: {
            productExternalId: PRODUCT_EXTERNAL_ID,
          },
          service: {
            externalId: SERVICE_EXTERNAL_ID,
            name: SERVICE_NAME,
          },
          account: {
            id: ACCOUNT_ID,
            type: 'test',
          },
          locals: {
            csrf: 'test-csrf-token',
          },
        })
        await call('get')
      })

      it('should call getProductByExternalId with correct parameters', () => {
        sinon.assert.calledWith(mockGetProductByExternalId, PRODUCT_EXTERNAL_ID)
      })

      it('should call the response method with expected template and data', () => {
        sinon.assert.calledOnceWithMatch(
          mockResponse,
          req,
          res,
          'simplified-account/services/payment-links/delete/index',
          {
            service: sinon.match({
              externalId: SERVICE_EXTERNAL_ID,
              name: SERVICE_NAME,
            }),
            account: sinon.match({
              id: ACCOUNT_ID,
              type: 'test',
            }),
            csrf: 'test-csrf-token',
            backLink: '/test-path',
            cancelUrl: '/test-path',
            paymentLink: sinon.match({
              externalId: PRODUCT_EXTERNAL_ID,
              name: 'Test Payment Link',
              description: 'Test description',
              formattedPrice: '£10.00',
              referenceLabel: 'Test Reference',
            }),
            deleteUrl: sinon.match.string,
          }
        )
      })

      it('should format price correctly using penceToPoundsWithCurrency', () => {
        sinon.assert.calledWithMatch(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          sinon.match.any,
          sinon.match({
            paymentLink: sinon.match({
              formattedPrice: '£10.00',
            }),
          })
        )
      })
    })

    describe('when payment link does not exist', () => {
      before(async () => {
        mockGetProductByExternalId.resolves(null)
        nextRequest({
          params: {
            productExternalId: PRODUCT_EXTERNAL_ID,
          },
          service: {
            externalId: SERVICE_EXTERNAL_ID,
          },
          account: {
            id: ACCOUNT_ID,
            type: 'test',
          },
          redirect: mockRedirect,
        })
        await call('get')
      })

      it('should redirect to payment links index when payment link not found', () => {
        sinon.assert.calledWith(mockRedirect, '/test-path')
      })
    })

    describe('when there is an error loading payment link', () => {
      before(async () => {
        mockGetProductByExternalId.rejects(new Error('Database error'))
        nextRequest({
          params: {
            productExternalId: PRODUCT_EXTERNAL_ID,
          },
          service: {
            externalId: SERVICE_EXTERNAL_ID,
          },
          account: {
            id: ACCOUNT_ID,
            type: 'test',
          },
          redirect: mockRedirect,
        })
        await call('get')
      })

      it('should redirect to payment links index on error', () => {
        sinon.assert.calledWith(mockRedirect, '/test-path')
      })

      it('should log the error with context', () => {
        sinon.assert.calledWith(
          mockLogger.error,
          'Error loading payment link for deletion',
          sinon.match.instanceOf(Error)
        )
      })
    })
  })

  describe('post', () => {
    describe('when user selects "No"', () => {
      before(async () => {
        nextRequest({
          params: {
            productExternalId: PRODUCT_EXTERNAL_ID,
          },
          service: {
            externalId: SERVICE_EXTERNAL_ID,
            name: SERVICE_NAME,
          },
          account: {
            id: ACCOUNT_ID,
            type: 'test',
          },
          user: {
            externalId: 'user-123',
          },
          body: {
            'confirm-delete': 'no',
            csrfToken: 'test-csrf-token',
          },
          session: {
            pageData: {},
          },
          redirect: mockRedirect,
        })
        await call('post')
      })

      it('should redirect to payment links index without calling delete', () => {
        sinon.assert.calledWith(mockRedirect, '/test-path')
        sinon.assert.notCalled(mockProductsClientDelete)
      })
    })

    describe('when deletion is successful', () => {
      before(async () => {
        mockProductsClientDelete.resolves()
        nextRequest({
          params: {
            productExternalId: PRODUCT_EXTERNAL_ID,
          },
          service: {
            externalId: SERVICE_EXTERNAL_ID,
            name: SERVICE_NAME,
          },
          account: {
            id: ACCOUNT_ID,
            type: 'test',
          },
          user: {
            externalId: 'user-123',
          },
          body: {
            'confirm-delete': 'yes',
            csrfToken: 'test-csrf-token',
          },
          session: {
            pageData: {},
          },
          redirect: mockRedirect,
        })
        await call('post')
      })

      it('should call products client delete with correct parameters', () => {
        sinon.assert.calledWith(mockProductsClientDelete, ACCOUNT_ID, PRODUCT_EXTERNAL_ID)
      })

      it('should log successful deletion', () => {
        sinon.assert.calledWith(mockLogger.info, 'Successfully deleted payment link', PRODUCT_EXTERNAL_ID)
      })

      it('should set success message in session and redirect', () => {
        const request = mockRedirect.getCall(0).thisValue as { session?: SessionData } | undefined
        expect(request?.session?.pageData?.deleteSuccess).to.deep.equal({
          type: 'payment-link',
          id: PRODUCT_EXTERNAL_ID,
        })
        sinon.assert.calledWith(mockRedirect, '/test-path')
      })
    })

    describe('when deletion fails', () => {
      before(async () => {
        mockProductsClientDelete.rejects(new Error('API Error'))
        nextRequest({
          params: {
            productExternalId: PRODUCT_EXTERNAL_ID,
          },
          service: {
            externalId: SERVICE_EXTERNAL_ID,
          },
          account: {
            id: ACCOUNT_ID,
            type: 'test',
          },
          user: {
            externalId: 'user-123',
          },
          body: {
            'confirm-delete': 'yes',
            csrfToken: 'test-csrf-token',
          },
          session: {
            pageData: {},
          },
          redirect: mockRedirect,
        })
        await call('post')
      })

      it('should log the deletion error', () => {
        sinon.assert.calledWith(mockLogger.error, 'Error calling delete method', sinon.match.instanceOf(Error))
      })

      it('should log the general error', () => {
        sinon.assert.calledWith(mockLogger.error, 'Error deleting payment link', sinon.match.instanceOf(Error))
      })

      it('should set error message in session and redirect back', () => {
        const request = mockRedirect.getCall(0).thisValue as { session?: SessionData } | undefined
        expect(request?.session?.pageData?.deleteError).to.deep.include({
          type: 'payment-link',
          message: 'Unable to delete payment link. Please try again.',
        })
        sinon.assert.calledWith(mockRedirect, 'back')
      })
    })

    describe('when no confirmation selection is made', () => {
      before(async () => {
        mockGetProductByExternalId.resolves(mockPaymentLink)
        nextRequest({
          params: {
            productExternalId: PRODUCT_EXTERNAL_ID,
          },
          service: {
            externalId: SERVICE_EXTERNAL_ID,
            name: SERVICE_NAME,
          },
          account: {
            id: ACCOUNT_ID,
            type: 'test',
          },
          user: {
            externalId: 'user-123',
          },
          body: {
            csrfToken: 'test-csrf-token',
          },
          session: {
            pageData: {},
          },
          locals: {
            csrf: 'test-csrf-token',
          },
        })
        await call('post')
      })

      it('should not call products client delete', () => {
        sinon.assert.notCalled(mockProductsClientDelete)
      })

      it('should call getProductByExternalId to reload payment link data', () => {
        sinon.assert.calledWith(mockGetProductByExternalId, PRODUCT_EXTERNAL_ID)
      })

      it('should re-render the form with validation errors', () => {
        sinon.assert.calledWithMatch(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/services/payment-links/delete/index',
          sinon.match({
            errors: sinon.match({
              summary: sinon.match((errors: ValidationError['summary']) => {
                expect(errors).to.be.an('array')
                expect(errors[0]).to.include({
                  href: '#confirm-delete',
                  text: 'Confirm if you want to delete Test Payment Link',
                })
                return true
              }),
            }),
            formData: sinon.match({
              csrfToken: 'test-csrf-token',
            }),
            paymentLink: sinon.match({
              externalId: PRODUCT_EXTERNAL_ID,
              name: 'Test Payment Link',
            }),
          })
        )
      })
    })

    describe('when invalid confirmation selection is made', () => {
      before(async () => {
        mockGetProductByExternalId.resolves(mockPaymentLink)
        nextRequest({
          params: {
            productExternalId: PRODUCT_EXTERNAL_ID,
          },
          service: {
            externalId: SERVICE_EXTERNAL_ID,
            name: SERVICE_NAME,
          },
          account: {
            id: ACCOUNT_ID,
            type: 'test',
          },
          user: {
            externalId: 'user-123',
          },
          body: {
            'confirm-delete': 'maybe',
            csrfToken: 'test-csrf-token',
          },
          session: {
            pageData: {},
          },
          locals: {
            csrf: 'test-csrf-token',
          },
        })
        await call('post')
      })

      it('should not call products client delete for invalid selection', () => {
        sinon.assert.notCalled(mockProductsClientDelete)
      })

      it('should re-render form with validation error for invalid selection', () => {
        sinon.assert.calledWithMatch(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/services/payment-links/delete/index',
          sinon.match({
            errors: sinon.match({
              summary: sinon.match((errors: ValidationError['summary']) => {
                expect(errors).to.be.an('array')
                expect(errors[0].text).to.include('Confirm if you want to delete Test Payment Link')
                return true
              }),
            }),
            formData: sinon.match({
              'confirm-delete': 'maybe',
            }),
          })
        )
      })
    })

    describe('when payment link not found during validation error re-render', () => {
      before(async () => {
        mockGetProductByExternalId.resolves(null)
        nextRequest({
          params: {
            productExternalId: PRODUCT_EXTERNAL_ID,
          },
          service: {
            externalId: SERVICE_EXTERNAL_ID,
            name: SERVICE_NAME,
          },
          account: {
            id: ACCOUNT_ID,
            type: 'test',
          },
          body: {
            csrfToken: 'test-csrf-token',
          },
          session: {
            pageData: {},
          },
          redirect: mockRedirect,
        })
        await call('post')
      })

      it('should redirect to payment links index when payment link not found during validation', () => {
        sinon.assert.calledWith(mockRedirect, '/test-path')
      })

      it('should log warning when payment link not found during validation', () => {
        sinon.assert.calledWith(
          mockLogger.warn,
          'Payment link not found during validation, redirecting',
          PRODUCT_EXTERNAL_ID
        )
      })
    })

    describe('when payment link with no reference label', () => {
      const paymentLinkWithoutReference = {
        ...mockPaymentLink,
        referenceEnabled: false,
        referenceLabel: null,
      }

      before(async () => {
        mockGetProductByExternalId.resolves(paymentLinkWithoutReference)
        nextRequest({
          params: {
            productExternalId: PRODUCT_EXTERNAL_ID,
          },
          service: {
            externalId: SERVICE_EXTERNAL_ID,
            name: SERVICE_NAME,
          },
          account: {
            id: ACCOUNT_ID,
            type: 'test',
          },
          locals: {
            csrf: 'test-csrf-token',
          },
        })
        await call('get')
      })

      it('should use default reference label when reference is disabled', () => {
        sinon.assert.calledWithMatch(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          sinon.match.any,
          sinon.match({
            paymentLink: sinon.match({
              referenceLabel: 'Created by GOV.UK Pay',
            }),
          })
        )
      })
    })

    describe('when payment link has no price set', () => {
      const paymentLinkWithoutPrice = {
        ...mockPaymentLink,
        price: null,
      }

      before(async () => {
        mockGetProductByExternalId.resolves(paymentLinkWithoutPrice)
        nextRequest({
          params: {
            productExternalId: PRODUCT_EXTERNAL_ID,
          },
          service: {
            externalId: SERVICE_EXTERNAL_ID,
            name: SERVICE_NAME,
          },
          account: {
            id: ACCOUNT_ID,
            type: 'test',
          },
          locals: {
            csrf: 'test-csrf-token',
          },
        })
        await call('get')
      })

      it('should show "User can choose" when no price is set', () => {
        sinon.assert.calledWithMatch(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          sinon.match.any,
          sinon.match({
            paymentLink: sinon.match({
              formattedPrice: 'User can choose',
            }),
          })
        )
      })
    })
  })
})
