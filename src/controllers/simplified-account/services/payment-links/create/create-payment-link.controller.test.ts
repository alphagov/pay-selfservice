import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import formatAccountPathsFor from '@utils/format-account-paths-for'
import paths from '@root/paths'
import { expect } from 'chai'

const SERVICE_EXTERNAL_ID = 'service123abc'
const GATEWAY_ACCOUNT_ID = 117
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'gateway-account-external-id-123'

const mockResponse = sinon.spy()

const mockPublicAuthClient = {
  createTokenForAccount: sinon.stub().resolves({
    token: 'api_test_token123',
  }),
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
  })
  .withUser({
    email: 'test@example.com',
  })
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/clients/public-auth.client': mockPublicAuthClient,
  })
  .build()

req.session = req.session || {}

describe('Controller: services/payment-links/create', () => {
  beforeEach(() => {
    mockResponse.resetHistory()
    mockPublicAuthClient.createTokenForAccount.resetHistory()

    req.session = req.session || {}
    if (req.session.pageData) {
      delete req.session.pageData
    }
  })

  afterEach(() => {
    if (req.session && req.session.pageData) {
      delete req.session.pageData
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
        {
          service: sinon.match.object,
          account: sinon.match.object,
          backLink: formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.paymentLinks.index,
            SERVICE_EXTERNAL_ID,
            GatewayAccountType.TEST
          ),
          formValues: {},
        }
      )
    })
  })

  describe('post', () => {
    describe('successful creation with fixed amount', () => {
      beforeEach(async () => {
        nextRequest({
          body: {
            name: 'Test Payment Link',
            description: 'A description',
            reference: 'yes',
            referenceLabel: 'Invoice number',
            referenceHint: 'Enter your invoice number',
            amountType: 'fixed',
            amount: '10.50',
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

      it('should save session data in correct format', () => {
        sinon.assert.calledOnce(mockPublicAuthClient.createTokenForAccount)

        sinon.assert.calledOnce(res.redirect)

        if (req.session.pageData && req.session.pageData.createPaymentLink) {
          const sessionData = req.session.pageData.createPaymentLink
          expect(sessionData.paymentLinkTitle).to.equal('Test Payment Link')
          expect(sessionData.paymentLinkDescription).to.equal('A description')
          expect(sessionData.serviceNamePath).to.equal('test-service')
          expect(sessionData.productNamePath).to.equal('test-payment-link')
          expect(sessionData.isWelsh).to.equal(false)
          expect(sessionData.payApiToken).to.equal('api_test_token123')
          expect(sessionData.gatewayAccountId).to.equal(GATEWAY_ACCOUNT_ID)
          expect(sessionData.paymentReferenceType).to.equal('custom')
          expect(sessionData.paymentReferenceLabel).to.equal('Invoice number')
          expect(sessionData.paymentReferenceHint).to.equal('Enter your invoice number')
          expect(sessionData.paymentLinkAmount).to.equal(1050)
        }
      })

      it('should redirect to old review page', () => {
        sinon.assert.calledWith(
          res.redirect,
          formatAccountPathsFor(paths.account.paymentLinks.review, GATEWAY_ACCOUNT_EXTERNAL_ID)
        )
      })
    })

    describe('successful creation with variable amount', () => {
      beforeEach(async () => {
        nextRequest({
          body: {
            name: 'Donation Link',
            description: '',
            reference: 'no',
            amountType: 'variable',
            amountHint: 'Please give generously',
          },
        })
        await call('post')
      })

      it('should save session data without fixed amount', () => {
        sinon.assert.calledOnce(mockPublicAuthClient.createTokenForAccount)

        sinon.assert.calledOnce(res.redirect)

        if (req.session.pageData && req.session.pageData.createPaymentLink) {
          const sessionData = req.session.pageData.createPaymentLink

          expect(sessionData.paymentLinkTitle).to.equal('Donation Link')
          expect(sessionData.paymentLinkDescription).to.equal('')
          expect(sessionData.paymentLinkAmount).to.be.undefined
          expect(sessionData.amountHint).to.equal('Please give generously')
          expect(sessionData.paymentReferenceType).to.be.undefined
        }
      })

      it('should redirect to old review page', () => {
        sinon.assert.calledWith(
          res.redirect,
          formatAccountPathsFor(paths.account.paymentLinks.review, GATEWAY_ACCOUNT_EXTERNAL_ID)
        )
      })
    })

    describe('validation errors', () => {
      describe('missing required fields', () => {
        beforeEach(async () => {
          nextRequest({
            body: {
              name: '',
              amountType: '',
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
            })
          )
        })

        it('should not create a token', () => {
          sinon.assert.notCalled(mockPublicAuthClient.createTokenForAccount)
        })

        it('should not save session data', () => {
          expect(req.session.pageData).to.be.undefined
        })
      })

      describe('invalid amount', () => {
        beforeEach(async () => {
          nextRequest({
            body: {
              name: 'Test',
              amountType: 'fixed',
              amount: 'invalid',
            },
          })
          await call('post')
        })

        it('should return validation errors', () => {
          sinon.assert.calledWith(
            mockResponse,
            sinon.match.any,
            sinon.match.any,
            'simplified-account/services/payment-links/create/index',
            sinon.match.has('errors')
          )
        })
      })

      describe('amount too low', () => {
        beforeEach(async () => {
          nextRequest({
            body: {
              name: 'Test',
              amountType: 'fixed',
              amount: '0.00',
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
            sinon.match.has('errors')
          )
        })
      })

      describe('amount too high', () => {
        beforeEach(async () => {
          nextRequest({
            body: {
              name: 'Test',
              amountType: 'fixed',
              amount: '100001',
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
            sinon.match.has('errors')
          )
        })
      })

      describe('title too long', () => {
        beforeEach(async () => {
          nextRequest({
            body: {
              name: 'a'.repeat(231),
              amountType: 'fixed',
              amount: '10',
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
            sinon.match.has('errors')
          )
        })
      })

      describe('title at maximum length', () => {
        beforeEach(async () => {
          nextRequest({
            body: {
              name: 'a'.repeat(230),
              amountType: 'fixed',
              amount: '10',
            },
          })
          await call('post')
        })

        it('should create token successfully', () => {
          sinon.assert.calledOnce(mockPublicAuthClient.createTokenForAccount)
        })

        it('should redirect to old review page', () => {
          sinon.assert.calledWith(
            res.redirect,
            formatAccountPathsFor(paths.account.paymentLinks.review, GATEWAY_ACCOUNT_EXTERNAL_ID)
          )
        })
      })

      describe('missing reference label when reference enabled', () => {
        beforeEach(async () => {
          nextRequest({
            body: {
              name: 'Test',
              reference: 'yes',
              referenceLabel: '',
              amountType: 'fixed',
              amount: '10',
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
            sinon.match.has('errors')
          )
        })
      })
    })
  })
})
