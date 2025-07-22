import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { expect } from 'chai'

const SERVICE_EXTERNAL_ID = 'service123abc'
const GATEWAY_ACCOUNT_ID = 117
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'gateway-account-external-id-123'

const mockResponse = sinon.spy()

interface SessionWithPageData {
  pageData?: {
    createPaymentLink?: {
      paymentLinkTitle?: string
      paymentLinkDescription?: string
      serviceNamePath?: string
      productNamePath?: string
      isWelsh?: boolean
    }
  }
}

const { res, req, call, nextRequest } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/payment-links/create/payment-link-information.controller'
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
      cy: 'Gwasanaeth Prawf'
    }
  })
  .withUser({
    email: 'test@example.com',
  })
  .withStubs({
    '@utils/response': { response: mockResponse },
  })
  .build()

req.session = req.session || {}

describe('Controller: services/payment-links/create (Step 1)', () => {
  beforeEach(() => {
    mockResponse.resetHistory()
    req.session = req.session || {}
    const session = req.session as unknown as SessionWithPageData
    if (session.pageData) {
      delete session.pageData
    }
  })

  afterEach(() => {
    const session = req.session as unknown as SessionWithPageData
    if (session?.pageData) {
      delete session.pageData
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
          friendlyURL: sinon.match.any,
          serviceName: sinon.match.any,
        }
      )
    })
  })

  describe('post', () => {
    describe('successful form submission', () => {
      beforeEach(async () => {
        nextRequest({
          body: {
            name: 'Test Payment Link',
            description: 'A description',
          },
        })
        await call('post')
      })

      it('should save basic session data without hardcoded values', () => {
        const session = req.session as unknown as SessionWithPageData
        const sessionData = session.pageData?.createPaymentLink

        expect(sessionData?.paymentLinkTitle).to.equal('Test Payment Link');
        expect(sessionData?.paymentLinkDescription).to.equal('A description');
        expect(sessionData?.serviceNamePath).to.equal('test-service');
        expect(sessionData?.productNamePath).to.equal('test-payment-link');
        expect(sessionData?.isWelsh).to.equal(false);
      })

      it('should redirect to reference page', () => {
        sinon.assert.calledWith(
          res.redirect,
          formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.paymentLinks.reference,
            SERVICE_EXTERNAL_ID,
            GatewayAccountType.TEST
          )
        )
      })
    })

    describe('validation errors', () => {
      describe('missing required fields', () => {
        beforeEach(async () => {
          nextRequest({
            body: {
              name: '',
              description: '',
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

        it('should not save session data', () => {
          const session = req.session as unknown as SessionWithPageData
          expect(session.pageData).to.equal(undefined);
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
            sinon.match.has('errors')
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

        it('should redirect to reference page', () => {
          sinon.assert.calledWith(
            res.redirect,
            formatServiceAndAccountPathsFor(
              paths.simplifiedAccount.paymentLinks.reference,
              SERVICE_EXTERNAL_ID,
              GatewayAccountType.TEST
            )
          )
        })
      })
    })

    describe('Welsh language handling', () => {
      beforeEach(async () => {
        nextRequest({
          query: { language: 'cy' },
          body: {
            name: 'Test Payment Link',
            description: 'A description',
          },
        })
        await call('post')
      })

      it('should save Welsh language preference in session', () => {
        const session = req.session as unknown as SessionWithPageData
        const sessionData = session.pageData?.createPaymentLink

        expect(sessionData?.isWelsh).to.equal(true);
      })
    })
  })
})
