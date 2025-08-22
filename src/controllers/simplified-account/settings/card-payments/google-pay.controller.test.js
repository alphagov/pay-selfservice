const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const { expect } = require('chai')
const sinon = require('sinon')
const paths = require('@root/paths')
const { WORLDPAY, STRIPE } = require('@models/constants/payment-providers')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')

const ACCOUNT_TYPE = 'test'
const SERVICE_EXTERNAL_ID = 'service-id-123abc'

const mockResponse = sinon.stub()
const mockUpdateGooglePay = sinon.spy()
const mockUpdateGooglePayMerchantId = sinon.spy()

const {
  req,
  res,
  nextRequest,
  call
} = new ControllerTestBuilder('@controllers/simplified-account/settings/card-payments/google-pay.controller')
  .withAccount({
    type: ACCOUNT_TYPE,
    allowGooglePay: false,
    paymentProvider: STRIPE
  })
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/card-payments.service': { updateAllowGooglePay: mockUpdateGooglePay },
    '@services/worldpay-details.service': { updateGooglePayMerchantId: mockUpdateGooglePayMerchantId }
  })
  .build()

describe('Controller: settings/card-payments/google-pay', () => {
  describe('get', () => {
    describe('a non-worldpay account', () => {
      beforeEach(async () => {
        await call('get', 1)
      })
      it('should call the response method', () => {
        expect(mockResponse).to.have.been.calledOnce
      })
      it('should pass req, res and template path to the response method', () => {
        expect(mockResponse.args[0][0]).to.deep.equal(req)
        expect(mockResponse.args[0][1]).to.deep.equal(res)
        expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/card-payments/google-pay')
      })

      it('should pass context data to the response method', () => {
        const context = mockResponse.args[0][3]
        expect(context).to.not.have.property('currentGooglePayMerchantId')
        expect(context).to.have.property('currentState').to.equal('off')
        expect(context).to.have.property('backLink').to.equal(`/service/${SERVICE_EXTERNAL_ID}/account/test/settings/card-payments`)
      })
    })

    describe('a worldpay account', () => {
      beforeEach(async () => {
        nextRequest({
          account: {
            paymentProvider: WORLDPAY,
            getCurrentCredential: () => {
              return {
                credentials: {
                  googlePayMerchantId: 'blah'
                }
              }
            }
          }
        })
        await call('get', 1)
      })

      it('should include google pay merchant id in the context', () => {
        const context = mockResponse.args[0][3]
        expect(context).to.have.property('currentGooglePayMerchantId').to.equal('blah')
      })
    })
  })
  describe('post', () => {
    describe('a non-worldpay account', () => {
      beforeEach(async () => {
        nextRequest({
          body: { googlePay: 'on' }
        })
        await call('post', 1)
      })

      it('should not update Google Pay merchant id', () => {
        sinon.assert.notCalled(mockUpdateGooglePayMerchantId)
      })

      it('should update allow Google Pay enabled', () => {
        expect(mockUpdateGooglePay.calledOnce).to.be.true
        sinon.assert.calledWith(mockUpdateGooglePay, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, true)
      })

      it('should redirect to the card payments index page', () => {
        sinon.assert.calledOnceWithExactly(res.redirect,
          formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE)
        )
      })
    })

    describe('a worldpay account', () => {
      beforeEach(async () => {
        nextRequest({
          body: {
            googlePay: 'on',
            googlePayMerchantId: '0123456789abcde'
          },
          user: {
            externalId: 'user-123-abc'
          },
          account: {
            paymentProvider: WORLDPAY,
            getCurrentCredential: () => {
              return {
                externalId: 'credential-123-abc'
              }
            }
          }
        })
        await call('post', 1)
      })

      it('should update Google Pay merchant id', () => {
        sinon.assert.calledOnceWithExactly(mockUpdateGooglePayMerchantId,
          SERVICE_EXTERNAL_ID,
          ACCOUNT_TYPE,
          'credential-123-abc',
          'user-123-abc',
          '0123456789abcde'
        )
      })

      it('should update allow Google Pay enabled', () => {
        expect(mockUpdateGooglePay.calledOnce).to.be.true
        sinon.assert.calledWith(mockUpdateGooglePay, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, true)
      })

      it('should redirect to the card payments index page', () => {
        sinon.assert.calledOnceWithExactly(res.redirect,
          formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE)
        )
      })
    })
  })
})
