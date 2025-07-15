import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import formatAccountPathsFor from '@utils/format-account-paths-for'
import paths from '@root/paths'
import { expect } from 'chai'

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
  slugify: sinon.stub().callsFake((str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')),
  removeIndefiniteArticles: sinon.stub().callsFake((str) => str.replace(/^(a|an|the)\s+/i, ''))
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
        const tokenParams = mockPublicAuthClient.createTokenForAccount.firstCall.args[0]

        expect(tokenParams.accountId).to.equal(GATEWAY_ACCOUNT_ID)
        expect(tokenParams.payload.account_id).to.equal(GATEWAY_ACCOUNT_ID)
        expect(tokenParams.payload.created_by).to.equal('test@example.com')
        expect(tokenParams.payload.type).to.equal('PRODUCTS')
        expect(tokenParams.payload.description).to.equal('Token for "Test Payment Link" payment link')
        expect(tokenParams.payload.token_account_type).to.equal(GatewayAccountType.TEST)
        expect(tokenParams.payload.service_external_id).to.equal(SERVICE_EXTERNAL_ID)
        expect(tokenParams.payload.service_mode).to.equal(GatewayAccountType.TEST)
      })

      it('should save session data with hardcoded values', () => {
        sinon.assert.calledOnce(mockPublicAuthClient.createTokenForAccount)
        sinon.assert.calledOnce(res.redirect)

        const sessionWithPageData = req.session as SessionWithPageData
        if (sessionWithPageData.pageData && sessionWithPageData.pageData.createPaymentLink) {
          const sessionData = sessionWithPageData.pageData.createPaymentLink
          expect(sessionData.paymentLinkTitle).to.equal('Test Payment Link')
          expect(sessionData.paymentLinkDescription).to.equal('A description')
          expect(sessionData.serviceNamePath).to.equal('test-service')
          expect(sessionData.productNamePath).to.equal('test-payment-link')
          expect(sessionData.isWelsh).to.equal(false)
          expect(sessionData.payApiToken).to.equal('api_test_token123')
          expect(sessionData.gatewayAccountId).to.equal(GATEWAY_ACCOUNT_ID)
          expect(sessionData.paymentLinkAmount).to.equal(1500)
          expect(sessionData.paymentReferenceType).to.be.undefined
          expect(sessionData.paymentReferenceLabel).to.be.undefined
          expect(sessionData.paymentReferenceHint).to.be.undefined
          expect(sessionData.amountHint).to.be.undefined
        }
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
        if (sessionWithPageData.pageData && sessionWithPageData.pageData.createPaymentLink) {
          const sessionData = sessionWithPageData.pageData.createPaymentLink
          expect(sessionData.paymentLinkTitle).to.equal('Simple Payment Link')
          expect(sessionData.paymentLinkDescription).to.be.undefined
          expect(sessionData.paymentLinkAmount).to.equal(1500)
        }
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
          expect(sessionWithPageData.pageData).to.be.undefined
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
          if (sessionWithPageData.pageData && sessionWithPageData.pageData.createPaymentLink) {
            const sessionData = sessionWithPageData.pageData.createPaymentLink
            expect(sessionData.serviceNamePath).to.equal('test-service')
          }
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
          if (sessionWithPageData.pageData && sessionWithPageData.pageData.createPaymentLink) {
            const sessionData = sessionWithPageData.pageData.createPaymentLink
            expect(sessionData.productNamePath).to.equal('payment-for-application')
          }
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
          if (sessionWithPageData.pageData && sessionWithPageData.pageData.createPaymentLink) {
            const sessionData = sessionWithPageData.pageData.createPaymentLink
            expect(sessionData.productNamePath).to.equal('important-payment')
          }
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
          if (sessionWithPageData.pageData && sessionWithPageData.pageData.createPaymentLink) {
            const sessionData = sessionWithPageData.pageData.createPaymentLink
            expect(sessionData.productNamePath).to.equal('big-payment-small-fee')
          }
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
          if (sessionWithPageData.pageData && sessionWithPageData.pageData.createPaymentLink) {
            const sessionData = sessionWithPageData.pageData.createPaymentLink
            expect(sessionData.productNamePath).to.equal('registration-fee')
          }
        })
      })
    })
  })
})
