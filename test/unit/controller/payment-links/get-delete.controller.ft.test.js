'use strict'

const supertest = require('supertest')
const { expect } = require('chai')
const nock = require('nock')

const { getApp } = require('../../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../../test-helpers/mock-session')
const paths = require('../../../../app/paths')
const { randomUuid } = require('../../../../app/utils/random')
const { validGatewayAccountResponse } = require('../../../fixtures/gateway-account.fixtures')

const GATEWAY_ACCOUNT_ID = '929'
const { PRODUCTS_URL, CONNECTOR_URL, PUBLIC_AUTH_URL } = process.env
const PAYMENT = {
  external_id: 'product-external-id-1',
  gateway_account_id: 'product-gateway-account-id-1',
  description: 'product-description-1',
  name: 'payment-name-1',
  price: '150',
  pay_api_token: 'blatoken',
  type: 'ADHOC',
  return_url: 'http://return.url',
  _links: [{
    rel: 'pay',
    href: 'http://pay.url',
    method: 'GET'
  }]
}

describe('Manage payment links - delete controller', () => {
  describe('when the payment link and api token are successfully deleted', () => {
    let response, session
    before(done => {
      const productExternalId = randomUuid()
      const user = getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{ name: 'tokens:create' }]
      })
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, validGatewayAccountResponse({ gateway_account_id: GATEWAY_ACCOUNT_ID }))
      nock(PUBLIC_AUTH_URL).delete(`/${GATEWAY_ACCOUNT_ID}`).reply(200, {
        revoked: '07/09/2018'
      })
      nock(PRODUCTS_URL).get(`/v1/api/gateway-account/${GATEWAY_ACCOUNT_ID}/products/${productExternalId}`).reply(200, PAYMENT)
      nock(PRODUCTS_URL).delete(`/v1/api/gateway-account/${GATEWAY_ACCOUNT_ID}/products/${productExternalId}`).reply(204)
      session = getMockSession(user)
      supertest(createAppWithSession(getApp(), session))
        .get(paths.paymentLinks.manage.delete.replace(':productExternalId', productExternalId))
        .end((err, res) => {
          response = res
          done(err)
        })
    })
    after(() => {
      nock.cleanAll()
    })

    it('should redirect with code 302', () => {
      expect(response.statusCode).to.equal(302)
    })

    it('should redirect to the manage page', () => {
      expect(response.header).to.have.property('location').to.equal(paths.paymentLinks.manage.index)
    })

    it('should add a relevant generic message to the session \'flash\'', () => {
      expect(session.flash).to.have.property('generic')
      expect(session.flash.generic.length).to.equal(1)
      expect(session.flash.generic[0]).to.equal('The payment link was successfully deleted')
    })
  })

  describe('when deleting the payment link fails but deleting token succeeds', () => {
    let response, session
    before(done => {
      const productExternalId = randomUuid()
      const user = getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{ name: 'tokens:create' }]
      })
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, {
        payment_provider: 'sandbox'
      })
      nock(PUBLIC_AUTH_URL).delete(`/${GATEWAY_ACCOUNT_ID}`).reply(200, {
        revoked: '07/09/2018'
      })
      nock(PRODUCTS_URL).get(`/v1/api/gateway-account/${GATEWAY_ACCOUNT_ID}/products/${productExternalId}`).reply(200, PAYMENT)
      nock(PRODUCTS_URL).delete(`/v1/api/gateway-account/${GATEWAY_ACCOUNT_ID}/products/${productExternalId}`)
        .replyWithError('Ruhroh! Something terrible has happened Shaggy!')
      session = getMockSession(user)
      supertest(createAppWithSession(getApp(), session))
        .get(paths.paymentLinks.manage.delete.replace(':productExternalId', productExternalId))
        .end((err, res) => {
          response = res
          done(err)
        })
    })
    after(() => {
      nock.cleanAll()
    })

    it('should redirect with code 302', () => {
      expect(response.statusCode).to.equal(302)
    })

    it('should redirect to the manage page', () => {
      expect(response.header).to.have.property('location').to.equal(paths.paymentLinks.manage.index)
    })

    it('should add a relevant error message to the session \'flash\'', () => {
      expect(session.flash).to.have.property('genericError')
      expect(session.flash.genericError.length).to.equal(1)
      expect(session.flash.genericError[0]).to.equal('Something went wrong when deleting the payment link. Please try again or contact support.')
    })
  })

  describe('when deleting the payment link succeeds but deleting token fails', () => {
    let response, session
    before(done => {
      const productExternalId = randomUuid()
      const user = getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{ name: 'tokens:create' }]
      })
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, {
        payment_provider: 'sandbox'
      })
      nock(PRODUCTS_URL).get(`/v1/api/gateway-account/${GATEWAY_ACCOUNT_ID}/products/${productExternalId}`).reply(200, PAYMENT)
      nock(PUBLIC_AUTH_URL).delete(`/${GATEWAY_ACCOUNT_ID}`).replyWithError('Ruhroh! Something terrible has happened Shaggy!')
      nock(PRODUCTS_URL).delete(`/v1/api/gateway-account/${GATEWAY_ACCOUNT_ID}/products/${productExternalId}`).reply(204)
      session = getMockSession(user)
      supertest(createAppWithSession(getApp(), session))
        .get(paths.paymentLinks.manage.delete.replace(':productExternalId', productExternalId))
        .end((err, res) => {
          response = res
          done(err)
        })
    })
    after(() => {
      nock.cleanAll()
    })

    it('should redirect with code 302', () => {
      expect(response.statusCode).to.equal(302)
    })

    it('should redirect to the manage page', () => {
      expect(response.header).to.have.property('location').to.equal(paths.paymentLinks.manage.index)
    })

    it('should add a relevant error message to the session \'flash\'', () => {
      expect(session.flash).to.have.property('genericError')
      expect(session.flash.genericError.length).to.equal(1)
      expect(session.flash.genericError[0]).to.equal('Something went wrong when deleting the payment link. Please try again or contact support.')
    })
  })

  describe('when failing to fetch information about a product', () => {
    let response, session
    before(done => {
      const productExternalId = randomUuid()
      const user = getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{ name: 'tokens:create' }]
      })
      nock(PRODUCTS_URL).get(`/v1/api/gateway-account/${GATEWAY_ACCOUNT_ID}/products/${productExternalId}`).replyWithError('Ruhroh! Something terrible has happened Shaggy!')
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, {
        payment_provider: 'sandbox'
      })
      nock(PUBLIC_AUTH_URL).delete(`/${GATEWAY_ACCOUNT_ID}`).reply(200, {
        revoked: '07/09/2018'
      })
      nock(PRODUCTS_URL).delete(`/v1/api/gateway-account/${GATEWAY_ACCOUNT_ID}/products/${productExternalId}`).reply(204)
      session = getMockSession(user)
      supertest(createAppWithSession(getApp(), session))
        .get(paths.paymentLinks.manage.delete.replace(':productExternalId', productExternalId))
        .end((err, res) => {
          response = res
          done(err)
        })
    })
    after(() => {
      nock.cleanAll()
    })

    it('should redirect with code 302', () => {
      expect(response.statusCode).to.equal(302)
    })

    it('should redirect to the manage page', () => {
      expect(response.header).to.have.property('location').to.equal(paths.paymentLinks.manage.index)
    })

    it('should add a relevant error message to the session \'flash\'', () => {
      expect(session.flash).to.have.property('genericError')
      expect(session.flash.genericError.length).to.equal(1)
      expect(session.flash.genericError[0]).to.equal('Something went wrong when deleting the payment link. Please try again or contact support.')
    })
  })
})
