'use strict'

const supertest = require('supertest')
const nock = require('nock')
const {getApp} = require('../../../../server')
const mockSession = require('../../../test_helpers/mock_session')
const userCreator = require('../../../test_helpers/user_creator')
const paths = require('../../../../app/paths')
const {expect} = require('chai')

const ACCOUNT_ID = 182364
const PAYMENT = {
  external_id: 'product-external-id',
  gateway_account_id: 'product-gateway-account-id',
  description: 'product-description',
  name: 'payment-name',
  price: '150',
  return_url: 'http://return.url',
  _links: [{
    rel: 'pay',
    href: 'http://pay.url',
    method: 'GET'
  }]
}

function mockGetProductsByGatewayAccountEndpoint (gatewayAccountId) {
  return nock(process.env.PRODUCTS_URL).get('/v1/api/products?gatewayAccountId=' + gatewayAccountId)
}

describe('Show the prototype links', () => {
  let app
  before(function () {
    const user = mockSession.getUser({
      gateway_account_ids: [ACCOUNT_ID], permissions: [{name: 'transactions:read'}]
    })
    app = mockSession.getAppWithLoggedInUser(getApp(), user)
    userCreator.mockUserResponse(user.toJson())
  })

  describe('when no links exist', () => {
    let response
    before(function (done) {
      mockGetProductsByGatewayAccountEndpoint(ACCOUNT_ID).reply(200, [])

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

  describe('when at least one link exist', () => {
    let response
    before(function (done) {
      mockGetProductsByGatewayAccountEndpoint(ACCOUNT_ID).reply(200, [PAYMENT])

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
      expect(response.body).to.have.property('productsSingular', false)
      expect(response.body).to.have.deep.property('products', [{
        description: 'product-description',
        externalId: 'product-external-id',
        gatewayAccountId: 'product-gateway-account-id',
        name: 'payment-name',
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

  describe('when at least one link exist', () => {
    let response
    before(function (done) {
      mockGetProductsByGatewayAccountEndpoint(ACCOUNT_ID).replyWithError('an error')

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
