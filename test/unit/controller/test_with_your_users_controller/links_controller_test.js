'use strict'

const supertest = require('supertest')
const nock = require('nock')
const {getApp} = require('../../../../server')
const mockSession = require('../../../test_helpers/mock_session')
const userCreator = require('../../../test_helpers/user_creator')
const paths = require('../../../../app/paths')
const {expect} = require('chai')

const {PRODUCTS_URL, CONNECTOR_URL} = process.env

const GATEWAY_ACCOUNT_ID = 182364
const PAYMENT_1 = {
  external_id: 'product-external-id-1',
  gateway_account_id: 'product-gateway-account-id-1',
  description: 'product-description-1',
  name: 'payment-name-1',
  price: '150',
  return_url: 'http://return.url',
  _links: [{
    rel: 'pay',
    href: 'http://pay.url',
    method: 'GET'
  }]
}

const PAYMENT_2 = {
  external_id: 'product-external-id-2',
  gateway_account_id: 'product-gateway-account-id-2',
  description: 'product-description-2',
  name: 'payment-name-2',
  price: '150',
  return_url: 'http://return.url',
  _links: [{
    rel: 'pay',
    href: 'http://pay.url',
    method: 'GET'
  }]
}

function mockGetProductsByGatewayAccountEndpoint (gatewayAccountId) {
  return nock(PRODUCTS_URL).get('/v1/api/products?gatewayAccountId=' + gatewayAccountId)
}

describe('Show the prototype links', () => {
  let app
  before(function () {
    const user = mockSession.getUser({
      gateway_account_ids: [GATEWAY_ACCOUNT_ID], permissions: [{name: 'transactions:read'}]
    })
    app = mockSession.getAppWithLoggedInUser(getApp(), user)
    userCreator.mockUserResponse(user.toJson())
  })

  describe('when no links exist', () => {
    let response
    before(function (done) {
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`)
        .reply(200, {
          payment_provider: 'sandbox'
        })
      mockGetProductsByGatewayAccountEndpoint(GATEWAY_ACCOUNT_ID).reply(200, [])

      supertest(app)
        .get(paths.prototyping.demoService.links)
        .set('Accept', 'application/json')
        .end((err, res) => {
          response = res
          done(err)
        })
    })

    after(() => {
      nock.cleanAll()
    })

    it('should toggle the product tab', () => {
      expect(response.body).to.have.property('productsTab', true)
    })

    it('should display the correct page links', () => {
      expect(response.body).to.have.property('createPage', paths.prototyping.demoService.create)
      expect(response.body).to.have.property('indexPage', paths.prototyping.demoService.index)
      expect(response.body).to.have.property('linksPage', paths.prototyping.demoService.links)
    })

    it('should not display any link', () => {
      expect(response.body).to.have.property('productsLength', 0)
      expect(response.body).to.have.property('productsSingular', true)
    })
  })

  describe('when at least one link exists', () => {
    let response
    before(function (done) {
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`)
        .reply(200, {
          payment_provider: 'sandbox'
        })
      mockGetProductsByGatewayAccountEndpoint(GATEWAY_ACCOUNT_ID).reply(200, [PAYMENT_1])

      supertest(app)
        .get(paths.prototyping.demoService.links)
        .set('Accept', 'application/json')
        .end((err, res) => {
          response = res
          done(err)
        })
    })

    after(() => {
      nock.cleanAll()
    })

    it('should toggle the product tab', () => {
      expect(response.body).to.have.property('productsTab', true)
    })

    it('should display the correct page links', () => {
      expect(response.body).to.have.property('createPage', paths.prototyping.demoService.create)
      expect(response.body).to.have.property('indexPage', paths.prototyping.demoService.index)
      expect(response.body).to.have.property('linksPage', paths.prototyping.demoService.links)
    })

    it('should display all the links', () => {
      expect(response.body).to.have.property('productsLength', 1)
      expect(response.body).to.have.property('productsSingular', true)
      expect(response.body).to.have.deep.property('products', [{
        description: 'product-description-1',
        externalId: 'product-external-id-1',
        gatewayAccountId: 'product-gateway-account-id-1',
        name: 'payment-name-1',
        price: '1.50',
        returnUrl: 'http://return.url',
        links: {
          pay: {
            href: 'http://pay.url',
            method: 'GET'
          }
        }
      }])
    })
  })

  describe('when more than one link exist', () => {
    let response
    before(function (done) {
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`)
        .reply(200, {
          payment_provider: 'sandbox'
        })
      mockGetProductsByGatewayAccountEndpoint(GATEWAY_ACCOUNT_ID).reply(200, [PAYMENT_1, PAYMENT_2])

      supertest(app)
        .get(paths.prototyping.demoService.links)
        .set('Accept', 'application/json')
        .end((err, res) => {
          response = res
          done(err)
        })
    })

    after(() => {
      nock.cleanAll()
    })

    it('should toggle the product tab', () => {
      expect(response.body).to.have.property('productsTab', true)
    })

    it('should display the correct page links', () => {
      expect(response.body).to.have.property('createPage', paths.prototyping.demoService.create)
      expect(response.body).to.have.property('indexPage', paths.prototyping.demoService.index)
      expect(response.body).to.have.property('linksPage', paths.prototyping.demoService.links)
    })

    it('should display all the links', () => {
      expect(response.body).to.have.property('productsLength', 2)
      expect(response.body).to.have.property('productsSingular', false)
      expect(response.body).to.have.deep.property('products', [{
        description: 'product-description-1',
        externalId: 'product-external-id-1',
        gatewayAccountId: 'product-gateway-account-id-1',
        name: 'payment-name-1',
        price: '1.50',
        returnUrl: 'http://return.url',
        links: {
          pay: {
            href: 'http://pay.url',
            method: 'GET'
          }
        }
      }, {
        description: 'product-description-2',
        externalId: 'product-external-id-2',
        gatewayAccountId: 'product-gateway-account-id-2',
        name: 'payment-name-2',
        price: '1.50',
        returnUrl: 'http://return.url',
        links: {
          pay: {
            href: 'http://pay.url',
            method: 'GET'
          }
        }
      }])
    })
  })

  describe('when there is a problem retrieving the products', () => {
    let response
    before(function (done) {
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`)
        .reply(200, {
          payment_provider: 'sandbox'
        })
      mockGetProductsByGatewayAccountEndpoint(GATEWAY_ACCOUNT_ID).replyWithError('an error')

      supertest(app)
        .get(paths.prototyping.demoService.links)
        .set('Accept', 'application/json')
        .end((err, res) => {
          response = res
          done(err)
        })
    })

    after(() => {
      nock.cleanAll()
    })

    it('should an internal server error', () => {
      expect(response.status).to.equal(500)
      expect(response.body).to.have.property('message', 'Internal server error')
    })
  })
})
