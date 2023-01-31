'use strict'

const supertest = require('supertest')
const { expect } = require('chai')
const nock = require('nock')
const { getApp } = require('../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../test-helpers/mock-session')
const formatAccountPathsFor = require('../../../app/utils/format-account-paths-for')
const { validGatewayAccountResponse } = require('../../fixtures/gateway-account.fixtures')
const { validProductResponse } = require('../../fixtures/product.fixtures')
const lodash = require('lodash')
const paths = require('../../../app/paths')

const { CONNECTOR_URL } = process.env
const { PRODUCTS_URL } = process.env
const GATEWAY_ACCOUNT_ID = '1968'
const EXTERNAL_GATEWAY_ACCOUNT_ID = 'an-external-id'
const PRODUCT_EXTERNAL_ID = 'a-product-external-id'

function mockConnectorGetAccount () {
  nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`)
    .reply(200, validGatewayAccountResponse(
      {
        external_id: EXTERNAL_GATEWAY_ACCOUNT_ID,
        gateway_account_id: GATEWAY_ACCOUNT_ID
      }
    ))
}

function mockGetProductsByGatewayAccountId () {
  nock(PRODUCTS_URL).get(`/v1/api/products/${PRODUCT_EXTERNAL_ID}`)
    .reply(200, validProductResponse(
      {
        external_id: PRODUCT_EXTERNAL_ID,
        gateway_account_id: GATEWAY_ACCOUNT_ID
    }))
}

describe('make a demo payment - go to transactions controller', () => {
  describe('when successfully redirects to transactions', () => {
    let result, app

    before('Arrange', () => {
      const session = getMockSession(getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{ name: 'transactions:read' }]
      }))
      mockGetProductsByGatewayAccountId()
      mockConnectorGetAccount()
      lodash.set(session, 'pageData.makeADemoPayment', {
        paymentDescription: 'A demo payment',
        paymentAmount: '10.50'
      })
      app = createAppWithSession(getApp(), session)
    })

    before('Act', done => {
      supertest(app)
        .get(paths.demoPaymentFwd.goToTransaction.replace(':productExternalId', PRODUCT_EXTERNAL_ID))
        .end((err, res) => {
          result = res
          done(err)
        })
    })

    after(() => {
      nock.cleanAll()
    })

    it('should return a statusCode of 302', () => {
      expect(result.statusCode).to.equal(302)
    })

    it('should redirect to transactions', () => {
      expect(result.headers).to.have.property('location').to.equal(formatAccountPathsFor(paths.account.transactions.index, EXTERNAL_GATEWAY_ACCOUNT_ID))
    })
  })
})