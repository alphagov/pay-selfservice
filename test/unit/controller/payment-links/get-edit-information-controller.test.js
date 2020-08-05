'use strict'

const supertest = require('supertest')
const nock = require('nock')
const { getApp } = require('../../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../../test-helpers/mock-session')
const paths = require('../../../../app/paths')
const { expect } = require('chai')
const formattedPathFor = require('../../../../app/utils/replace-params-in-path')

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

describe('Edit payment link information', () => {
  let session, response
  before(done => {
    const user = getUser({
      gateway_account_ids: [GATEWAY_ACCOUNT_ID],
      permissions: [{ name: 'tokens:create' }]
    })
    session = getMockSession(user)
    nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`)
      .reply(200, {
        payment_provider: 'sandbox'
      })
    mockGetByProductExternalIdEndpoint(GATEWAY_ACCOUNT_ID, PRODUCT_EXTERNAL_ID).reply(200, PAYMENT_1)

    supertest(createAppWithSession(getApp(), session))
      .get(formattedPathFor(paths.paymentLinks.editInformation, PRODUCT_EXTERNAL_ID))
      .set('Accept', 'application/json')
      .end((err, res) => {
        response = res
        done(err)
      })
  })

  after(() => {
    nock.cleanAll()
  })

  it('should display the correct page links', () => {
    expect(response.body).to.have.property('self', formattedPathFor(paths.paymentLinks.editInformation, PRODUCT_EXTERNAL_ID))
  })

  it('should pass the product', () => {
    expect(response.body).to.have.deep.property('product', {
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
})
