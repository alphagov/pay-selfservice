import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import formatAccountPathsFor from '@utils/format-account-paths-for'
import paths from '@root/paths'

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
    }
  }
}

const SERVICE_EXTERNAL_ID = 'service123abc'
const GATEWAY_ACCOUNT_ID = 117
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'gateway-account-external-id-123'

const mockResponse = sinon.spy()

const mockTokensCreate = sinon.stub().resolves({
  token: 'api_test_token123',
})

const mockCreateTokenRequest = {
  withGatewayAccountId: sinon.stub().returnsThis(),
  withServiceExternalId: sinon.stub().returnsThis(),
  withServiceMode: sinon.stub().returnsThis(),
  withDescription: sinon.stub().returnsThis(),
  withCreatedBy: sinon.stub().returnsThis(),
  withTokenUsageType: sinon.stub().returnsThis(),
  toPayload: sinon.stub().returns({}),
}

const MockCreateTokenRequest = sinon.stub().returns(mockCreateTokenRequest)

const mockPublicAuthClient = {
  tokens: {
    create: mockTokensCreate
  }
}

const { res, req, call, nextRequest } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/payment-links/create/payment-link-reference.controller'
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
  })
  .withUser({
    email: 'test@example.com',
  })
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/clients/pay/PublicAuthClient.class': {
      PublicAuthClient: sinon.stub().returns(mockPublicAuthClient)
    },
    '@models/public-auth/CreateTokenRequest.class': { CreateTokenRequest: MockCreateTokenRequest },
  })
  .build()

req.session = req.session || {}

describe('Controller: services/payment-links/reference', () => {
  beforeEach(() => {
    mockResponse.resetHistory()
    mockTokensCreate.resetHistory()
    MockCreateTokenRequest.resetHistory()

    Object.values(mockCreateTokenRequest).forEach(stub => {
      if (typeof stub.resetHistory === 'function') {
        stub.resetHistory()
      }
    })
  })

  afterEach(() => {
    const sessionWithPageData = req.session as SessionWithPageData
    if (sessionWithPageData.pageData?.createPaymentLink) {
      delete sessionWithPageData.pageData.createPaymentLink
    }
  })

  describe('get', () => {
    beforeEach(async () => {
      req.session = req.session || {}
      const sessionWithPageData = req.session as SessionWithPageData
      sessionWithPageData.pageData = {
        createPaymentLink: {
          paymentLinkTitle: 'Test Payment Link',
          paymentLinkDescription: 'A description',
          serviceNamePath: 'test-service',
          productNamePath: 'test-payment-link',
          isWelsh: false,
        }
      }

      await call('get')
    })

    it('should call the response method with correct parameters', () => {
      sinon.assert.calledWith(
        mockResponse,
        sinon.match.any,
        sinon.match.any,
        'simplified-account/services/payment-links/create/reference',
        {
          service: sinon.match.object,
          account: sinon.match.object,
          backLink: formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.paymentLinks.create,
            SERVICE_EXTERNAL_ID,
            GatewayAccountType.TEST
          ),
          formValues: {},
        }
      )
    })
  })

  describe('post', () => {
    describe('successful creation with custom reference', () => {
      beforeEach(async () => {
        req.session = req.session || {}
        const sessionWithPageData = req.session as SessionWithPageData
        sessionWithPageData.pageData = {
          createPaymentLink: {
            paymentLinkTitle: 'Test Payment Link',
            paymentLinkDescription: 'A description',
            serviceNamePath: 'test-service',
            productNamePath: 'test-payment-link',
            isWelsh: false,
          }
        }

        nextRequest({
          body: {
            reference: 'yes',
            referenceLabel: 'Invoice number',
            referenceHint: 'Enter your invoice number',
          },
        })
        await call('post')
      })

      it('should create API token with correct parameters', () => {
        sinon.assert.calledOnce(mockTokensCreate)
        sinon.assert.calledOnce(MockCreateTokenRequest)

        sinon.assert.calledWith(mockCreateTokenRequest.withGatewayAccountId, GATEWAY_ACCOUNT_ID)
        sinon.assert.calledWith(mockCreateTokenRequest.withServiceExternalId, SERVICE_EXTERNAL_ID)
        sinon.assert.calledWith(mockCreateTokenRequest.withServiceMode, GatewayAccountType.TEST)
        sinon.assert.calledWith(mockCreateTokenRequest.withDescription, 'Token for "Test Payment Link" payment link')
        sinon.assert.calledWith(mockCreateTokenRequest.withCreatedBy, 'test@example.com')
        sinon.assert.calledWith(mockCreateTokenRequest.withTokenUsageType, 'PRODUCTS')

        sinon.assert.calledWith(mockTokensCreate, mockCreateTokenRequest)
      })

      it('should process request successfully and redirect to review page', () => {
        sinon.assert.calledOnce(mockTokensCreate)

        sinon.assert.calledWith(
          res.redirect,
          formatAccountPathsFor(paths.account.paymentLinks.review, GATEWAY_ACCOUNT_EXTERNAL_ID)
        )

        sinon.assert.calledWith(mockCreateTokenRequest.withDescription, 'Token for "Test Payment Link" payment link')
      })

      it('should redirect to the review page', () => {
        sinon.assert.calledWith(
          res.redirect,
          formatAccountPathsFor(paths.account.paymentLinks.review, GATEWAY_ACCOUNT_EXTERNAL_ID)
        )
      })
    })

    describe('successful creation with GOV.UK generated reference', () => {
      beforeEach(async () => {
        req.session = req.session || {}
        const sessionWithPageData = req.session as SessionWithPageData
        sessionWithPageData.pageData = {
          createPaymentLink: {
            paymentLinkTitle: 'Test Payment Link',
            paymentLinkDescription: 'A description',
            serviceNamePath: 'test-service',
            productNamePath: 'test-payment-link',
            isWelsh: false,
          }
        }

        nextRequest({
          body: {
            reference: 'no',
          },
        })
        await call('post')
      })

      it('should process request successfully and redirect to review page', () => {
        sinon.assert.calledOnce(mockTokensCreate)
        sinon.assert.calledWith(
          res.redirect,
          formatAccountPathsFor(paths.account.paymentLinks.review, GATEWAY_ACCOUNT_EXTERNAL_ID)
        )
      })

      it('should create token with correct parameters', () => {
        sinon.assert.calledOnce(mockTokensCreate)
        sinon.assert.calledWith(mockCreateTokenRequest.withDescription, 'Token for "Test Payment Link" payment link')
      })
    })

    describe('If there is no session data (i.e. the information step was skipped)', () => {
      beforeEach(async () => {
        req.session = req.session || {}
        const sessionWithPageData = req.session as SessionWithPageData
        sessionWithPageData.pageData = {}

        nextRequest({
          body: {
            reference: 'yes',
            referenceLabel: 'Invoice number',
          },
        })
        await call('post')
      })

      it('should redirect back to the information page', () => {
        sinon.assert.calledWith(
          res.redirect,
          formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.paymentLinks.create,
            SERVICE_EXTERNAL_ID,
            GatewayAccountType.TEST
          )
        )
      })

      it('should not create a token', () => {
        sinon.assert.notCalled(mockTokensCreate)
      })
    })

    describe('validation errors', () => {
      beforeEach(() => {
        req.session = req.session || {}
        const sessionWithPageData = req.session as SessionWithPageData
        sessionWithPageData.pageData = {
          createPaymentLink: {
            paymentLinkTitle: 'Test Payment Link',
            paymentLinkDescription: 'A description',
            serviceNamePath: 'test-service',
            productNamePath: 'test-payment-link',
            isWelsh: false,
          }
        }
      })

      describe('missing reference selection', () => {
        beforeEach(async () => {
          nextRequest({
            body: {
              reference: '',
            },
          })
          await call('post')
        })

        it('should call response with errors', () => {
          sinon.assert.calledWith(
            mockResponse,
            sinon.match.any,
            sinon.match.any,
            'simplified-account/services/payment-links/create/reference',
            sinon.match({
              errors: sinon.match.object,
              formValues: sinon.match.object,
            })
          )
        })

        it('should not create a token', () => {
          sinon.assert.notCalled(mockTokensCreate)
        })
      })

      describe('missing reference label when reference enabled', () => {
        beforeEach(async () => {
          nextRequest({
            body: {
              reference: 'yes',
              referenceLabel: '',
            },
          })
          await call('post')
        })

        it('should return validation error', () => {
          sinon.assert.calledWith(
            mockResponse,
            sinon.match.any,
            sinon.match.any,
            'simplified-account/services/payment-links/create/reference',
            sinon.match.has('errors')
          )
        })

        it('should not create a token', () => {
          sinon.assert.notCalled(mockTokensCreate)
        })
      })
    })
  })
})
