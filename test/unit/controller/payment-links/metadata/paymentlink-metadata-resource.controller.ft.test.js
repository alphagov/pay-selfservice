'use strict'

const supertest = require('supertest')
const { expect } = require('chai')
const cheerio = require('cheerio')
const nock = require('nock')
const csrf = require('csrf')

const { getApp } = require('../../../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../../../test-helpers/mock-session')
const paths = require('../../../../../app/paths')
const formattedPathFor = require('../../../../../app/utils/replace-params-in-path')

const { PRODUCTS_URL, CONNECTOR_URL } = process.env
const GATEWAY_ACCOUNT_ID = '929'
const productId = 'some-product-id'
const VALID_PAYLOAD = {
  'csrfToken': csrf().create('123'),
  'metadata-column-header': 'mykey',
  'metadata-cell-value': 'myvalue'
}
const VALID_USER = getUser({
  gateway_account_ids: [GATEWAY_ACCOUNT_ID],
  permissions: [{ name: 'tokens:create' }]
})
const VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE = {
  payment_provider: 'sandbox'
}

describe('Add payment link metadata', () => {
  describe('successfull add metadata submission', () => {
    let result, session, app
    before('Nock configuration', () => {
      const expectedProductRequest = { 'mykey': 'myvalue' }
      nock(PRODUCTS_URL).post(`/v1/api/products/${productId}/metadata`, expectedProductRequest).reply(201, {})
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE)
      session = getMockSession(VALID_USER)
      app = createAppWithSession(getApp(), session)
    })
    before('Supertest configuration', done => {
      const path = formattedPathFor(paths.paymentLinks.metadata.add, productId)
      supertest(app)
        .post(path)
        .send(VALID_PAYLOAD)
        .end((err, res) => {
          result = res
          done(err)
        })
    })
    after(() => {
      nock.cleanAll()
    })

    it('should succeed with products and redirect to the detail page', () => {
      expect(result.statusCode).to.equal(302)
      expect(session.flash).to.have.property('generic')
      expect(session.flash.generic.length).to.equal(1)
      expect(session.flash.generic[0]).to.equal('Updated reporting column mykey')
    })
  })

  describe('metadata submission is rejected', () => {
    let result, session, app, $

    before('Nock configuration', () => {
      const expectedProductRequest = {
        'mykey': 'myvalue'
      }
      nock(PRODUCTS_URL).post(`/v1/api/products/${productId}/metadata`, expectedProductRequest).replyWithError('Invalid product metadata add')
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE)
      session = getMockSession(VALID_USER)
      app = createAppWithSession(getApp(), session)
    })
    before('Supertest configuration', done => {
      const path = formattedPathFor(paths.paymentLinks.metadata.add, productId)
      supertest(app)
        .post(path)
        .send(VALID_PAYLOAD)
        .end((err, res) => {
          result = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })
    after(() => {
      nock.cleanAll()
    })

    it('should propagate both server and products errors through to client error summary', () => {
      expect(result.statusCode).to.equal(200)
      expect($('.govuk-error-summary__list li').length).to.equal(1)
    })
  })

  describe('successfull updating metadata given a known key', () => {
    let result, session, app
    before('Nock configuration', () => {
      const expectedProductRequest = { 'mykey': 'myvalue' }
      nock(PRODUCTS_URL).patch(`/v1/api/products/${productId}/metadata`, expectedProductRequest).reply(201, {})
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE)
      session = getMockSession(VALID_USER)
      app = createAppWithSession(getApp(), session)
    })
    before('Supertest configuration', done => {
      const path = formattedPathFor(paths.paymentLinks.metadata.edit, productId)
      supertest(app)
        .post(path)
        .send(VALID_PAYLOAD)
        .end((err, res) => {
          result = res
          done(err)
        })
    })
    after(() => {
      nock.cleanAll()
    })

    it('should succeed with products and redirect to the detail page', () => {
      expect(result.statusCode).to.equal(302)
      expect(session.flash).to.have.property('generic')
      expect(session.flash.generic.length).to.equal(1)
      expect(session.flash.generic[0]).to.equal('Updated reporting column mykey')
    })
  })

  describe('successfully delete metadata given a known key', () => {
    let result, session, app
    const metadataKey = 'key'
    before('Nock configuration', () => {
      nock(PRODUCTS_URL).delete(`/v1/api/products/${productId}/metadata/${metadataKey}`).reply(200, {})
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE)
      session = getMockSession(VALID_USER)
      app = createAppWithSession(getApp(), session)
    })
    before('Supertest configuration', done => {
      const path = formattedPathFor(paths.paymentLinks.metadata.delete, productId, metadataKey)
      supertest(app)
        .post(path)
        .send(VALID_PAYLOAD)
        .end((err, res) => {
          result = res
          done(err)
        })
    })
    after(() => {
      nock.cleanAll()
    })

    it('should succeed with products and redirect to the detail page', () => {
      expect(result.statusCode).to.equal(302)
      expect(session.flash).to.have.property('generic')
      expect(session.flash.generic.length).to.equal(1)
      expect(session.flash.generic[0]).to.equal(`Deleted reporting column ${metadataKey}`)
    })
  })
})
