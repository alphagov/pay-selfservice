'use strict'

const sinon = require('sinon')
const proxyquire = require('proxyquire')

const { validGatewayAccount } = require('../../../test/fixtures/gateway-account.fixtures')
const { validUserResponse } = require('../../../test/fixtures/user.fixtures')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const paths = require('../../paths')
const User = require('../../models/User.class')
const { RESTClientError } = require('@govuk-pay/pay-js-commons/lib/utils/axios-base-client/errors')

const gatewayAccountCredentialId = 12
const gatewayMerchantId = 'a-gateway-merchant-id'

let req
let res
let next
let responseMock
let patchGooglePayGatewayMerchantIdSuccess
let toggleGooglePaySuccess

describe('Google Pay settings POST controller', () => {
  beforeEach(() => {
    res = {
      redirect: sinon.spy(),
      render: sinon.spy()
    }
    next = sinon.spy()
    responseMock = sinon.spy()
    patchGooglePayGatewayMerchantIdSuccess = sinon.spy(() => Promise.resolve())
    toggleGooglePaySuccess = sinon.spy(() => Promise.resolve())
  })

  describe('Worldpay account', () => {
    beforeEach(() => {
      req = {
        account: validGatewayAccount({
          payment_provider: 'worldpay',
          gateway_account_credentials: [{
            id: gatewayAccountCredentialId
          }]
        }),
        user: new User(validUserResponse()),
        flash: sinon.spy()
      }
    })

    it('should re-render page with an error if merchant ID is not set when enabling Google Pay', async () => {
      req.body = {
        'google-pay': 'on'
      }
      const controller = getControllerWithMocks(patchGooglePayGatewayMerchantIdSuccess, toggleGooglePaySuccess)
      await controller(req, res, next)

      sinon.assert.calledWith(responseMock, req, res, 'digital-wallet/google-pay', {
        errors: { merchantId: 'Enter a valid Merchant ID' },
        enabled: true
      })
      sinon.assert.notCalled(patchGooglePayGatewayMerchantIdSuccess)
      sinon.assert.notCalled(toggleGooglePaySuccess)
    })

    it('should call connector to update gateway merchant ID and set Google Pay to enabled', async () => {
      req.body = {
        'google-pay': 'on',
        merchantId: gatewayMerchantId
      }
      const controller = getControllerWithMocks(patchGooglePayGatewayMerchantIdSuccess, toggleGooglePaySuccess)
      await controller(req, res, next)

      sinon.assert.calledWith(patchGooglePayGatewayMerchantIdSuccess, req.account.gateway_account_id, gatewayAccountCredentialId, gatewayMerchantId, req.user.externalId)
      sinon.assert.calledWith(toggleGooglePaySuccess, req.account.gateway_account_id, true)
      sinon.assert.calledWith(req.flash, 'generic', 'Google Pay successfully enabled')
      sinon.assert.calledWith(res.redirect, formatAccountPathsFor(paths.account.settings.index, req.account.external_id))
    })

    it('should call next with an error when connector returns an unexpected error updating the gateway merchant ID', async () => {
      req.body = {
        'google-pay': 'on',
        merchantId: gatewayMerchantId
      }
      const error = new Error()
      const patchGooglePayGatewayMerchantIdError = sinon.spy(() => Promise.reject(error))
      const controller = getControllerWithMocks(patchGooglePayGatewayMerchantIdError, toggleGooglePaySuccess)
      await controller(req, res, next)

      sinon.assert.called(patchGooglePayGatewayMerchantIdError)
      sinon.assert.notCalled(toggleGooglePaySuccess)
      sinon.assert.calledWith(next, error)
    })

    it('should re-render page with an error if connector returns a 400 error updating the gateway merchant id', async () => {
      req.body = {
        'google-pay': 'on',
        merchantId: gatewayMerchantId
      }
      const error = new RESTClientError('an error', 'connector', 400)
      const patchGooglePayGatewayMerchantIdError = sinon.spy(() => Promise.reject(error))
      const controller = getControllerWithMocks(patchGooglePayGatewayMerchantIdError, toggleGooglePaySuccess)
      await controller(req, res, next)

      sinon.assert.called(patchGooglePayGatewayMerchantIdError)
      sinon.assert.notCalled(toggleGooglePaySuccess)
      sinon.assert.notCalled(next)

      sinon.assert.calledWith(responseMock, req, res, 'digital-wallet/google-pay', {
        errors: { merchantId: 'There was an error enabling google pay. Check that the Merchant ID you entered is correct and that your PSP account credentials have been set.' },
        enabled: true
      })
    })

    it('should call next with an error when connector returns an unexpected error updating google pay flag', async () => {
      req.body = {
        'google-pay': 'on',
        merchantId: gatewayMerchantId
      }
      const error = new Error()
      const toggleGooglePayError = sinon.spy(() => Promise.reject(error))
      const controller = getControllerWithMocks(patchGooglePayGatewayMerchantIdSuccess, toggleGooglePayError)
      await controller(req, res, next)

      sinon.assert.called(patchGooglePayGatewayMerchantIdSuccess)
      sinon.assert.called(toggleGooglePayError)
      sinon.assert.calledWith(next, error)
    })

    it('should call connector to toggle Google Pay to disabled without requiring gateway merchant ID', async () => {
      req.body = {
        'google-pay': 'off'
      }

      const controller = getControllerWithMocks(patchGooglePayGatewayMerchantIdSuccess, toggleGooglePaySuccess)
      await controller(req, res, next)

      sinon.assert.notCalled(patchGooglePayGatewayMerchantIdSuccess)
      sinon.assert.calledWith(toggleGooglePaySuccess, req.account.gateway_account_id, false)
      sinon.assert.calledWith(req.flash, 'generic', 'Google Pay successfully disabled')
      sinon.assert.calledWith(res.redirect, formatAccountPathsFor(paths.account.settings.index, req.account.external_id))
    })
  })

  describe('Stripe account', () => {
    it('should call connector to toggle Google Pay to enabled without requiring gateway merchant ID', async () => {
      const req = {
        body: {
          'google-pay': 'on'
        },
        account: validGatewayAccount({
          payment_provider: 'stripe'
        }),
        flash: sinon.spy()
      }
      const controller = getControllerWithMocks(patchGooglePayGatewayMerchantIdSuccess, toggleGooglePaySuccess)
      await controller(req, res, next)

      sinon.assert.notCalled(patchGooglePayGatewayMerchantIdSuccess)
      sinon.assert.calledWith(toggleGooglePaySuccess, req.account.gateway_account_id, true)
      sinon.assert.calledWith(req.flash, 'generic', 'Google Pay successfully enabled')
      sinon.assert.calledWith(res.redirect, formatAccountPathsFor(paths.account.settings.index, req.account.external_id))
    })
  })
})

function getControllerWithMocks (patchGooglePayGatewayMerchantIdMock, toggleGooglePayMock) {
  return proxyquire('./post-google-pay.controller.js', {
    '../../utils/response': {
      response: responseMock
    },
    '../../services/clients/connector.client': {
      ConnectorClient: function () {
        this.patchGooglePayGatewayMerchantId = patchGooglePayGatewayMerchantIdMock
        this.toggleGooglePay = toggleGooglePayMock
      }
    }
  })
}
