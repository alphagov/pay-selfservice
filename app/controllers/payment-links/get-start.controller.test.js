'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { expect } = require('chai')
const mockResponses = {}

const getController = function (mockResponses) {
  return proxyquire('./get-start.controller', {
    '../../utils/response': mockResponses
  })
}

describe('The Worldpay MOTO account warning', () => {
  let req
  let res
  let createPaymentLinkStartController

  beforeEach(() => {
    mockResponses.response = sinon.spy()
    createPaymentLinkStartController = getController(mockResponses)
    res = {}
  })

  describe('when the gateway account has a Worldpay credentials object with a merchant code ending with ‘MOTO’', () => {
    it('should pass accountUsesWorldpayMotoMerchantCode with a value of true', () => {
      req = {
        account: {
          gateway_account_credentials: [{
            state: 'ACTIVE',
            payment_provider: 'worldpay',
            credentials: {
              merchant_id: 'merchant-code-ends-with-MOTO'
            }
          }]
        }
      }

      createPaymentLinkStartController(req, res)
      expect(mockResponses.response.args[0][3]).to.have.property('accountUsesWorldpayMotoMerchantCode').to.equal(true)
    })
  })

  describe('when the gateway account has a Worldpay credentials object with a merchant code not ending with ‘MOTO’', () => {
    it('should pass accountUsesWorldpayMotoMerchantCode with a value of false', () => {
      req = {
        account: {
          gateway_account_credentials: [{
            state: 'ACTIVE',
            payment_provider: 'worldpay',
            credentials: {
              merchant_id: 'merchant-code-ends-with-MOTO-ah-no-it-does-not'
            }
          }]
        }
      }

      createPaymentLinkStartController(req, res)
      expect(mockResponses.response.args[0][3]).to.have.property('accountUsesWorldpayMotoMerchantCode').to.equal(false)
    })
  })

  describe('when the gateway account has a non-Worldpay credentials object with a merchant code ending with ‘MOTO’', () => {
    it('should pass accountUsesWorldpayMotoMerchantCode with a value of false', () => {
      req = {
        account: {
          gateway_account_credentials: [{
            state: 'ACTIVE',
            payment_provider: 'not-worldpay',
            credentials: {
              merchant_id: 'merchant-code-ends-with-MOTO'
            }
          }]
        }
      }

      createPaymentLinkStartController(req, res)
      expect(mockResponses.response.args[0][3]).to.have.property('accountUsesWorldpayMotoMerchantCode').to.equal(false)
    })
  })

  describe('when the gateway account has a Worldpay credentials object without a merchant_id', () => {
    it('should pass accountUsesWorldpayMotoMerchantCode with a value of false', () => {
      req = {
        account: {
          gateway_account_credentials: [{
            state: 'ACTIVE',
            payment_provider: 'worldpay',
            credentials: {}
          }]
        }
      }

      createPaymentLinkStartController(req, res)
      expect(mockResponses.response.args[0][3]).to.have.property('accountUsesWorldpayMotoMerchantCode').to.equal(false)
    })
  })

  describe('when the gateway account has no credentials object', () => {
    it('should pass accountUsesWorldpayMotoMerchantCode with a value of false', () => {
      req = {
        account: {
          gateway_account_credentials: [{
            state: 'ACTIVE',
            payment_provider: 'worldpay'
          }]
        }
      }

      createPaymentLinkStartController(req, res)
      expect(mockResponses.response.args[0][3]).to.have.property('accountUsesWorldpayMotoMerchantCode').to.equal(false)
    })
  })

  describe('when the gateway account has no credentials at all', () => {
    it('should pass accountUsesWorldpayMotoMerchantCode with a value of false', () => {
      req = {
        account: {
          gateway_account_credentials: []
        }
      }

      createPaymentLinkStartController(req, res)
      expect(mockResponses.response.args[0][3]).to.have.property('accountUsesWorldpayMotoMerchantCode').to.equal(false)
    })
  })
})
