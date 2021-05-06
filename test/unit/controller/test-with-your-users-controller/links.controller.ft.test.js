'use strict'

const supertest = require('supertest')
const nock = require('nock')
const { expect } = require('chai')

const { getApp } = require('../../../../server')
const mockSession = require('../../../test-helpers/mock-session')
const userCreator = require('../../../test-helpers/user-creator')
const paths = require('../../../../app/paths')
const { validGatewayAccountResponse } = require('../../../fixtures/gateway-account.fixtures')
const formatAccountPathsFor = require('../../../../app/utils/format-account-paths-for')

const { PRODUCTS_URL, CONNECTOR_URL } = process.env

const GATEWAY_ACCOUNT_ID = '182364'
const EXTERNAL_GATEWAY_ACCOUNT_ID = 'an-external-id'

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

function mockGetProductsByGatewayAccountAndTypeEndpoint (gatewayAccountId, productType) {
  return nock(PRODUCTS_URL).get(`/v1/api/gateway-account/${gatewayAccountId}/products?type=${productType}`)
}

function mockConnectorGetAccount () {
  nock(CONNECTOR_URL).get(`/v1/frontend/accounts/external-id/${EXTERNAL_GATEWAY_ACCOUNT_ID}`)
    .reply(200, validGatewayAccountResponse(
      {
        external_id: EXTERNAL_GATEWAY_ACCOUNT_ID,
        gateway_account_id: GATEWAY_ACCOUNT_ID
      }
    ))
}

describe('Show the prototype links', () => {
  let app
  before(function () {
    const user = mockSession.getUser({
      gateway_account_ids: [GATEWAY_ACCOUNT_ID], permissions: [{ name: 'transactions:read' }]
    })
    app = mockSession.getAppWithLoggedInUser(getApp(), user)
    userCreator.mockUserResponse(user.toJson())
  })

  describe('when no links exist', () => {
    let response
    before(function (done) {
      mockConnectorGetAccount()
      mockGetProductsByGatewayAccountAndTypeEndpoint(GATEWAY_ACCOUNT_ID, 'PROTOTYPE').reply(200, [])

      supertest(app)
        .get(formatAccountPathsFor(paths.account.prototyping.demoService.links, EXTERNAL_GATEWAY_ACCOUNT_ID))
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
      expect(response.body).to.have.property('createPage', formatAccountPathsFor(paths.account.prototyping.demoService.create, EXTERNAL_GATEWAY_ACCOUNT_ID))
      expect(response.body).to.have.property('indexPage', formatAccountPathsFor(paths.account.prototyping.demoService.index, EXTERNAL_GATEWAY_ACCOUNT_ID))
      expect(response.body).to.have.property('linksPage', formatAccountPathsFor(paths.account.prototyping.demoService.links, EXTERNAL_GATEWAY_ACCOUNT_ID))
    })

    it('should not display any link', () => {
      expect(response.body).to.have.property('productsLength', 0)
    })
  })

  describe('when at least one link exists', () => {
    let response
    before(function (done) {
      mockConnectorGetAccount()
      mockGetProductsByGatewayAccountAndTypeEndpoint(GATEWAY_ACCOUNT_ID, 'PROTOTYPE').reply(200, [PAYMENT_1])

      supertest(app)
        .get(formatAccountPathsFor(paths.account.prototyping.demoService.links, EXTERNAL_GATEWAY_ACCOUNT_ID))
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
      expect(response.body).to.have.property('createPage', formatAccountPathsFor(paths.account.prototyping.demoService.create, EXTERNAL_GATEWAY_ACCOUNT_ID))
      expect(response.body).to.have.property('indexPage', formatAccountPathsFor(paths.account.prototyping.demoService.index, EXTERNAL_GATEWAY_ACCOUNT_ID))
      expect(response.body).to.have.property('linksPage', formatAccountPathsFor(paths.account.prototyping.demoService.links, EXTERNAL_GATEWAY_ACCOUNT_ID))
    })

    it('should display all the links', () => {
      expect(response.body).to.have.property('productsLength', 1)
      expect(response.body).to.have.deep.property('products', [{
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
    before(function (done) {
      mockConnectorGetAccount()
      mockGetProductsByGatewayAccountAndTypeEndpoint(GATEWAY_ACCOUNT_ID, 'PROTOTYPE').reply(200, [PAYMENT_1, PAYMENT_2])

      supertest(app)
        .get(formatAccountPathsFor(paths.account.prototyping.demoService.links, EXTERNAL_GATEWAY_ACCOUNT_ID))
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
      expect(response.body).to.have.property('createPage', formatAccountPathsFor(paths.account.prototyping.demoService.create, EXTERNAL_GATEWAY_ACCOUNT_ID))
      expect(response.body).to.have.property('indexPage', formatAccountPathsFor(paths.account.prototyping.demoService.index, EXTERNAL_GATEWAY_ACCOUNT_ID))
      expect(response.body).to.have.property('linksPage', formatAccountPathsFor(paths.account.prototyping.demoService.links, EXTERNAL_GATEWAY_ACCOUNT_ID))
    })

    it('should display all the links', () => {
      expect(response.body).to.have.property('productsLength', 2)
      expect(response.body).to.have.deep.property('products', [{
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

  describe('when there is a problem retrieving the products', () => {
    let response
    before(function (done) {
      mockConnectorGetAccount()
      mockGetProductsByGatewayAccountAndTypeEndpoint(GATEWAY_ACCOUNT_ID, 'PROTOTYPE').replyWithError('an error')

      supertest(app)
        .get(formatAccountPathsFor(paths.account.prototyping.demoService.links, EXTERNAL_GATEWAY_ACCOUNT_ID))
        .set('Accept', 'application/json')
        .end((err, res) => {
          response = res
          done(err)
        })
    })

    after(() => {
      nock.cleanAll()
    })

    it('should show an error page', () => {
      expect(response.status).to.equal(500)
      expect(response.body).to.have.property('message', 'There is a problem with the payments platform. Please contact the support team.')
    })
  })
})
