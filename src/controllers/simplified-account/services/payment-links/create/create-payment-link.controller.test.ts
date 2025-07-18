import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import formatAccountPathsFor from '@utils/format-account-paths-for'
import paths from '@root/paths'
import { strict as assert } from 'assert'

interface SessionWithPageData {
  pageData?: {
    createPaymentLink?: {
      paymentLinkTitle?: string
      paymentLinkDescription?: string
      serviceNamePath?: string
      productNamePath?: string
      isWelsh?: boolean
      payApiToken?: string
      gatewayAccountId?: number
      paymentLinkAmount?: number
      paymentReferenceType?: string
      paymentReferenceLabel?: string
      paymentReferenceHint?: string
      amountHint?: string
    }
  }
}

interface CreateTokenParams {
  accountId: number
  payload: {
    account_id: number
    created_by: string
    type: string
    description: string
    token_account_type: string
    service_external_id: string
    service_mode: string
  }
}

const SERVICE_EXTERNAL_ID = 'service123abc'
const GATEWAY_ACCOUNT_ID = 117
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'gateway-account-external-id-123'

const mockResponse = sinon.spy()

const mockPublicAuthClient = {
  createTokenForAccount: sinon.stub().resolves({
    token: 'api_test_token123',
  }),
}

const mockNunjucksFilters = {
  slugify: sinon.stub().callsFake((str: string): string =>
    str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  ),
  removeIndefiniteArticles: sinon.stub().callsFake((str: string): string =>
    str.replace(/^(a|an|the)\s+/i, '')
  )
}

const { res, req, call, nextRequest } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/payment-links/create/create-payment-link.controller'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount({
    id: GATEWAY_ACCOUNT_ID,
    externalId: GATEWAY_ACCOUNT_EXTERNAL_ID,
    type: GatewayAccountType.TEST,
  })
  .withService({
    externalId: SERVICE_EXTERNAL_ID,
    name: 'Test Service',
    serviceName: {
      en: 'Test Service',
      cy: 'Test Service Welsh',
    },
  })
  .withUser({
    email: 'test@example.com',
  })
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/clients/public-auth.client': mockPublicAuthClient,
    '@govuk-pay/pay-js-commons': { nunjucksFilters: mockNunjucksFilters },
  })
  .build()

req.session = req.session || {}

describe('Controller: services/payment-links/create', () => {
  beforeEach(() => {
    mockResponse.resetHistory()
    mockPublicAuthClient.createTokenForAccount.resetHistory()
    mockNunjucksFilters.slugify.resetHistory()
    mockNunjucksFilters.removeIndefiniteArticles.resetHistory()

    process.env.PRODUCTS_FRIENDLY_BASE_URI = 'https://payments.gov.uk'

    req.session = req.session || {}
    const sessionWithPageData = req.session as SessionWithPageData
    if (sessionWithPageData.pageData) {
      delete sessionWithPageData.pageData
    }
  })

  afterEach(() => {
    delete process.env.PRODUCTS_FRIENDLY_BASE_URI

    const sessionWithPageData = req.session as SessionWithPageData
    if (sessionWithPageData.pageData) {
      delete sessionWithPageData.pageData
    }
  })

  describe('get', () => {
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
          formValues: {},
          friendlyURL: 'https://payments.gov.uk',
          serviceName: 'Test Service',
        })
      )
    })
  })

  describe('post', () => {
    describe('successful creation with name and description', () => {
      beforeEach(async () => {
        nextRequest({
          body: {
            name: 'Test Payment Link',
            description: 'A description',
          },
        })
        await call('post')
      })

      it('should create API token with correct parameters', () => {
        sinon.assert.calledOnce(mockPublicAuthClient.createTokenForAccount)
        const tokenParams = mockPublicAuthClient.createTokenForAccount.firstCall.args[0] as CreateTokenParams

        assert.strictEqual(tokenParams.accountId, GATEWAY_ACCOUNT_ID)
        assert.strictEqual(tokenParams.payload.account_id, GATEWAY_ACCOUNT_ID)
        assert.strictEqual(tokenParams.payload.created_by, 'test@example.com')
        assert.strictEqual(tokenParams.payload.type, 'PRODUCTS')
        assert.strictEqual(tokenParams.payload.description, 'Token for "Test Payment Link" payment link')
        assert.strictEqual(tokenParams.payload.token_account_type, GatewayAccountType.TEST)
        assert.strictEqual(tokenParams.payload.service_external_id, SERVICE_EXTERNAL_ID)
        assert.strictEqual(tokenParams.payload.service_mode, GatewayAccountType.TEST)
      })

      it('should save session data with hardcoded values', () => {
        sinon.assert.calledOnce(mockPublicAuthClient.createTokenForAccount)
        sinon.assert.calledOnce(res.redirect)

        const sessionWithPageData = req.session as SessionWithPageData
        const sessionData = sessionWithPageData.pageData?.createPaymentLink

        assert.ok(sessionData)
        assert.strictEqual(sessionData.paymentLinkTitle, 'Test Payment Link')
        assert.strictEqual(sessionData.paymentLinkDescription, 'A description')
        assert.strictEqual(sessionData.serviceNamePath, 'test-service')
        assert.strictEqual(sessionData.productNamePath, 'test-payment-link')
        assert.strictEqual(sessionData.isWelsh, false)
        assert.strictEqual(sessionData.payApiToken, 'api_test_token123')
        assert.strictEqual(sessionData.gatewayAccountId, GATEWAY_ACCOUNT_ID)
        assert.strictEqual(sessionData.paymentLinkAmount, 1500)
        assert.strictEqual(sessionData.paymentReferenceType, undefined)
        assert.strictEqual(sessionData.paymentReferenceLabel, undefined)
        assert.strictEqual(sessionData.paymentReferenceHint, undefined)
        assert.strictEqual(sessionData.amountHint, undefined)
      })

      it('should redirect to review page', () => {
        sinon.assert.calledWith(
          res.redirect,
          formatAccountPathsFor(paths.account.paymentLinks.review, GATEWAY_ACCOUNT_EXTERNAL_ID)
        )
      })
    })

    describe('successful creation with name only', () => {
      beforeEach(async () => {
        nextRequest({
          body: {
            name: 'Simple Payment Link',
          },
        })
        await call('post')
      })

      it('should save session data with empty description', () => {
        sinon.assert.calledOnce(mockPublicAuthClient.createTokenForAccount)
        sinon.assert.calledOnce(res.redirect)

        const sessionWithPageData = req.session as SessionWithPageData
        const sessionData = sessionWithPageData.pageData?.createPaymentLink

        assert.ok(sessionData)
        assert.strictEqual(sessionData.paymentLinkTitle, 'Simple Payment Link')
        assert.strictEqual(sessionData.paymentLinkDescription, undefined)
        assert.strictEqual(sessionData.paymentLinkAmount, 1500)
      })

      it('should redirect to review page', () => {
        sinon.assert.calledWith(
          res.redirect,
          formatAccountPathsFor(paths.account.paymentLinks.review, GATEWAY_ACCOUNT_EXTERNAL_ID)
        )
      })
    })

    describe('validation errors', () => {
      describe('missing required name field', () => {
        beforeEach(async () => {
          nextRequest({
            body: {
              name: '',
              description: 'Some description',
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
              friendlyURL: 'https://payments.gov.uk',
              serviceName: 'Test Service',
            })
          )
        })

        it('should not create a token', () => {
          sinon.assert.notCalled(mockPublicAuthClient.createTokenForAccount)
        })

        it('should not save session data', () => {
          const sessionWithPageData = req.session as SessionWithPageData
          assert.strictEqual(sessionWithPageData.pageData, undefined)
        })
      })

      describe('title too long', () => {
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
            sinon.match({
              errors: sinon.match.object,
              friendlyURL: 'https://payments.gov.uk',
              serviceName: 'Test Service',
            })
          )
        })
      })

      describe('title at maximum length', () => {
        beforeEach(async () => {
          nextRequest({
            body: {
              name: 'a'.repeat(230),
              description: 'Valid description',
            },
          })
          await call('post')
        })

        it('should create token successfully', () => {
          sinon.assert.calledOnce(mockPublicAuthClient.createTokenForAccount)
        })

        it('should redirect to review page', () => {
          sinon.assert.calledWith(
            res.redirect,
            formatAccountPathsFor(paths.account.paymentLinks.review, GATEWAY_ACCOUNT_EXTERNAL_ID)
          )
        })
      })

      describe('description too long', () => {
        beforeEach(async () => {
          nextRequest({
            body: {
              name: 'Valid name',
              description: 'a'.repeat(256),
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
            sinon.match({
              errors: sinon.match.object,
              friendlyURL: 'https://payments.gov.uk',
              serviceName: 'Test Service',
            })
          )
        })
      })

      describe('description at maximum length', () => {
        beforeEach(async () => {
          nextRequest({
            body: {
              name: 'Valid name',
              description: 'a'.repeat(255),
            },
          })
          await call('post')
        })

        it('should create token successfully', () => {
          sinon.assert.calledOnce(mockPublicAuthClient.createTokenForAccount)
        })

        it('should redirect to review page', () => {
          sinon.assert.calledWith(
            res.redirect,
            formatAccountPathsFor(paths.account.paymentLinks.review, GATEWAY_ACCOUNT_EXTERNAL_ID)
          )
        })
      })
    })

    describe('URL path generation with article removal', () => {
      describe('service name with articles', () => {
        beforeEach(async () => {
          req.service = {
            ...req.service,
            name: 'The Test Service',
            serviceName: {
              en: 'The Test Service',
              cy: 'The Test Service Welsh',
            },
          }

          nextRequest({
            body: {
              name: 'Test Payment Link',
              description: 'A description',
            },
          })
          await call('post')
        })

        it('should remove articles from service name path', () => {
          const sessionWithPageData = req.session as SessionWithPageData
          const sessionData = sessionWithPageData.pageData?.createPaymentLink
          assert.strictEqual(sessionData?.serviceNamePath, 'test-service')
        })
      })

      describe('product name with articles', () => {
        beforeEach(async () => {
          nextRequest({
            body: {
              name: 'A Payment for The Application',
              description: 'Test description',
            },
          })
          await call('post')
        })

        it('should remove articles from product name path', () => {
          const sessionWithPageData = req.session as SessionWithPageData
          const sessionData = sessionWithPageData.pageData?.createPaymentLink
          assert.strictEqual(sessionData?.productNamePath, 'payment-for-application')
        })
      })

      describe('product name starting with "An"', () => {
        beforeEach(async () => {
          nextRequest({
            body: {
              name: 'An Important Payment',
              description: 'Test description',
            },
          })
          await call('post')
        })

        it('should remove "An" article from product name path', () => {
          const sessionWithPageData = req.session as SessionWithPageData
          const sessionData = sessionWithPageData.pageData?.createPaymentLink
          assert.strictEqual(sessionData?.productNamePath, 'important-payment')
        })
      })

      describe('complex name with multiple articles and special characters', () => {
        beforeEach(async () => {
          nextRequest({
            body: {
              name: 'A Big Payment & The Small Fee',
              description: 'Test description',
            },
          })
          await call('post')
        })

        it('should remove articles and handle special characters', () => {
          const sessionWithPageData = req.session as SessionWithPageData
          const sessionData = sessionWithPageData.pageData?.createPaymentLink
          assert.strictEqual(sessionData?.productNamePath, 'big-payment-small-fee')
        })
      })

      describe('name without articles', () => {
        beforeEach(async () => {
          nextRequest({
            body: {
              name: 'Registration Fee',
              description: 'Test description',
            },
          })
          await call('post')
        })

        it('should slugify normally when no articles present', () => {
          const sessionWithPageData = req.session as SessionWithPageData
          const sessionData = sessionWithPageData.pageData?.createPaymentLink
          assert.strictEqual(sessionData?.productNamePath, 'registration-fee')
        })
      })
    })
  })
})
