'use strict'

const supertest = require('supertest')
const nock = require('nock')
const { getApp } = require('../../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../../test-helpers/mock-session')
const paths = require('../../../../app/paths')
const formattedPathFor = require('../../../../app/utils/replace-params-in-path')
const lodash = require('lodash')

const { PRODUCTS_URL, CONNECTOR_URL } = process.env

const GATEWAY_ACCOUNT_ID = '182364'
const PRODUCT_EXTERNAL_ID = '2903e4yohi0we9yho2hio'
const PAYMENT_1 = {
  external_id: 'product-external-id-1',
  gateway_account_id: 'product-gateway-account-id-1',
  description: 'product-description-1',
  name: 'payment-name-1',
  price: '150',
  type: 'ADHOC',
  return_url: 'http://return.url',
  _links: [{
    rel: 'pay',
    href: 'http://pay.url',
    method: 'GET'
  }]
}

const mockGetByProductExternalIdEndpoint = (gatewayAccountId, productExternalId) => {
  return nock(PRODUCTS_URL).get(`/v1/api/gateway-account/${gatewayAccountId}/products/${productExternalId}`)
}

describe('Edit a payment link', () => {
  let session
  beforeAll(() => {
    const user = getUser({
      gateway_account_ids: [GATEWAY_ACCOUNT_ID],
      permissions: [{ name: 'tokens:create' }]
    })
    session = getMockSession(user)
  })

  describe('when landing here for the first time', () => {
    let response
    beforeAll(done => {
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`)
        .reply(200, {
          payment_provider: 'sandbox'
        })
      mockGetByProductExternalIdEndpoint(GATEWAY_ACCOUNT_ID, PRODUCT_EXTERNAL_ID).reply(200, PAYMENT_1)

      supertest(createAppWithSession(getApp(), session))
        .get(formattedPathFor(paths.paymentLinks.edit, PRODUCT_EXTERNAL_ID))
        .set('Accept', 'application/json')
        .end((err, res) => {
          response = res
          done(err)
        })
    })

    afterAll(() => {
      nock.cleanAll()
    })

    it('should display the correct page links', () => {
      expect(response.body).toHaveProperty('self', formattedPathFor(paths.paymentLinks.edit, PRODUCT_EXTERNAL_ID))
      expect(response.body).toHaveProperty(
        'editInformation',
        formattedPathFor(paths.paymentLinks.editInformation, PRODUCT_EXTERNAL_ID)
      )
      expect(response.body).toHaveProperty(
        'editAmount',
        formattedPathFor(paths.paymentLinks.editAmount, PRODUCT_EXTERNAL_ID)
      )
    })

    it('should pass the product', () => {
      expect(response.body).toHaveProperty('product', {
        description: 'product-description-1',
        externalId: 'product-external-id-1',
        gatewayAccountId: 'product-gateway-account-id-1',
        name: 'payment-name-1',
        price: '150',
        returnUrl: 'http://return.url',
        links: {
          pay: {
            href: 'http://pay.url',
            method: 'GET'
          }
        },
        type: 'ADHOC'
      })
    })

    it('should set changed to false', () => {
      expect(response.body).toHaveProperty('changed', false)
    })
  })

  describe('when landing here after editing the link', () => {
    let response
    beforeAll(done => {
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`)
        .reply(200, {
          payment_provider: 'sandbox'
        })
      mockGetByProductExternalIdEndpoint(GATEWAY_ACCOUNT_ID, PRODUCT_EXTERNAL_ID).reply(200, PAYMENT_1)

      lodash.set(session, 'editPaymentLinkData', {
        name: 'Pay for an offline service'
      })

      supertest(createAppWithSession(getApp(), session))
        .get(formattedPathFor(paths.paymentLinks.edit, PRODUCT_EXTERNAL_ID))
        .set('Accept', 'application/json')
        .end((err, res) => {
          response = res
          done(err)
        })
    })

    afterAll(() => {
      nock.cleanAll()
    })

    it('should pass the updated product', () => {
      expect(response.body).toHaveProperty('product', {
        description: 'product-description-1',
        externalId: 'product-external-id-1',
        gatewayAccountId: 'product-gateway-account-id-1',
        name: 'Pay for an offline service',
        price: '150',
        returnUrl: 'http://return.url',
        links: {
          pay: {
            href: 'http://pay.url',
            method: 'GET'
          }
        },
        type: 'ADHOC'
      })
    })

    it('should set changed to true', () => {
      expect(response.body).toHaveProperty('changed', true)
    })
  })
})
