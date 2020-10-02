'use strict'

const supertest = require('supertest')
const nock = require('nock')
const { getApp } = require('../../../../server')
const mockSession = require('../../../test-helpers/mock-session')
const userCreator = require('../../../test-helpers/user-creator')
const paths = require('../../../../app/paths')

const { PRODUCTS_URL, CONNECTOR_URL } = process.env

const GATEWAY_ACCOUNT_ID = '182364'
const PAYMENT_1 = {
  external_id: 'product-external-id-1',
  gateway_account_id: 'product-gateway-account-id-1',
  description: 'product-description-1',
  name: 'payment-name-1',
  price: '150',
  type: 'PROTOTYPE',
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
  type: 'PROTOTYPE',
  return_url: 'http://return.url',
  _links: [{
    rel: 'pay',
    href: 'http://pay.url',
    method: 'GET'
  }]
}

const PAYMENT_3 = {
  external_id: 'product-external-id-3',
  gateway_account_id: 'product-gateway-account-id-3',
  description: 'product-description-3',
  name: 'payment-name-3',
  price: '150',
  type: 'LIVE',
  return_url: 'http://return.url',
  _links: [{
    rel: 'pay',
    href: 'http://pay.url',
    method: 'GET'
  }]
}

function mockGetProductsByGatewayAccountEndpoint (gatewayAccountId) {
  return nock(PRODUCTS_URL).get(`/v1/api/gateway-account/${gatewayAccountId}/products`)
}

describe('Show the prototype links', () => {
  let app
  beforeAll(() => {
    const user = mockSession.getUser({
      gateway_account_ids: [GATEWAY_ACCOUNT_ID], permissions: [{ name: 'transactions:read' }]
    })
    app = mockSession.getAppWithLoggedInUser(getApp(), user)
    userCreator.mockUserResponse(user.toJson())
  })

  describe('when no links exist', () => {
    let response
    beforeAll(done => {
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

    afterAll(() => {
      nock.cleanAll()
    })

    it('should toggle the product tab', () => {
      expect(response.body).toHaveProperty('productsTab', true)
    })

    it('should display the correct page links', () => {
      expect(response.body).toHaveProperty('createPage', paths.prototyping.demoService.create)
      expect(response.body).toHaveProperty('indexPage', paths.prototyping.demoService.index)
      expect(response.body).toHaveProperty('linksPage', paths.prototyping.demoService.links)
    })

    it('should not display any link', () => {
      expect(response.body).toHaveProperty('productsLength', 0)
    })
  })

  describe('when at least one link exists', () => {
    let response
    beforeAll(done => {
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

    afterAll(() => {
      nock.cleanAll()
    })

    it('should toggle the product tab', () => {
      expect(response.body).toHaveProperty('productsTab', true)
    })

    it('should display the correct page links', () => {
      expect(response.body).toHaveProperty('createPage', paths.prototyping.demoService.create)
      expect(response.body).toHaveProperty('indexPage', paths.prototyping.demoService.index)
      expect(response.body).toHaveProperty('linksPage', paths.prototyping.demoService.links)
    })

    it('should display all the links', () => {
      expect(response.body).toHaveProperty('productsLength', 1)
      expect(response.body).toHaveProperty('products', [{
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
        type: 'PROTOTYPE'
      }])
    })
  })

  describe('when more than one link exist', () => {
    let response
    beforeAll(done => {
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

    afterAll(() => {
      nock.cleanAll()
    })

    it('should toggle the product tab', () => {
      expect(response.body).toHaveProperty('productsTab', true)
    })

    it('should display the correct page links', () => {
      expect(response.body).toHaveProperty('createPage', paths.prototyping.demoService.create)
      expect(response.body).toHaveProperty('indexPage', paths.prototyping.demoService.index)
      expect(response.body).toHaveProperty('linksPage', paths.prototyping.demoService.links)
    })

    it('should display all the links', () => {
      expect(response.body).toHaveProperty('productsLength', 2)
      expect(response.body).toHaveProperty('products', [{
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
        type: 'PROTOTYPE'
      }, {
        description: 'product-description-2',
        externalId: 'product-external-id-2',
        gatewayAccountId: 'product-gateway-account-id-2',
        name: 'payment-name-2',
        price: '150',
        returnUrl: 'http://return.url',
        links: {
          pay: {
            href: 'http://pay.url',
            method: 'GET'
          }
        },
        type: 'PROTOTYPE'
      }])
    })
  })

  describe('when one prototype link and one live link exists', () => {
    let response
    beforeAll(done => {
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`)
        .reply(200, {
          payment_provider: 'sandbox'
        })
      mockGetProductsByGatewayAccountEndpoint(GATEWAY_ACCOUNT_ID).reply(200, [PAYMENT_1, PAYMENT_3])

      supertest(app)
        .get(paths.prototyping.demoService.links)
        .set('Accept', 'application/json')
        .end((err, res) => {
          response = res
          done(err)
        })
    })

    it('should display only prototype links', () => {
      expect(response.body).toHaveProperty('productsLength', 1)
      expect(response.body).toHaveProperty('products', [{
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
        type: 'PROTOTYPE'
      }])
    })
  })

  describe('when there is a problem retrieving the products', () => {
    let response
    beforeAll(done => {
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

    afterAll(() => {
      nock.cleanAll()
    })

    it('should show an error page', () => {
      expect(response.status).toBe(500)
      expect(response.body).toHaveProperty('message', 'There is a problem with the payments platform')
    })
  })
})
