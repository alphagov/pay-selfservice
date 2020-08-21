'use strict'

// NPM dependencies
const supertest = require('supertest')
const { expect } = require('chai')
const nock = require('nock')

// Local dependencies
const { getApp } = require('../../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../../test-helpers/mock-session')
const paths = require('../../../../app/paths')
const { randomUuid } = require('../../../../app/utils/random')

const GATEWAY_ACCOUNT_ID = '929'
const { PRODUCTS_URL, CONNECTOR_URL } = process.env

describe('Manage payment links - disable controller', () => {
  describe('when the payment link is successfully disabled', () => {
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
      nock(PRODUCTS_URL).patch(`/v1/api/gateway-account/${GATEWAY_ACCOUNT_ID}/products/${productExternalId}/disable`).reply(200)
      session = getMockSession(user)
      supertest(createAppWithSession(getApp(), session))
        .get(paths.paymentLinks.disable.replace(':productExternalId', productExternalId))
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
      expect(response.header).to.have.property('location').to.equal(paths.paymentLinks.manage)
    })

    it('should add a relevant generic message to the session \'flash\'', () => {
      expect(session.flash).to.have.property('generic')
      expect(session.flash.generic.length).to.equal(1)
      expect(session.flash.generic[0]).to.equal('The payment link was successfully deleted')
    })
  })

  describe('when disabling the payment link fails', () => {
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
      nock(PRODUCTS_URL).patch(`/v1/api/gateway-account/${GATEWAY_ACCOUNT_ID}/products/${productExternalId}/disable`)
        .replyWithError('Ruhroh! Something terrible has happened Shaggy!')
      session = getMockSession(user)
      supertest(createAppWithSession(getApp(), session))
        .get(paths.paymentLinks.disable.replace(':productExternalId', productExternalId))
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
      expect(response.header).to.have.property('location').to.equal(paths.paymentLinks.manage)
    })

    it('should add a relevant error message to the session \'flash\'', () => {
      expect(session.flash).to.have.property('genericError')
      expect(session.flash.genericError.length).to.equal(1)
      expect(session.flash.genericError[0]).to.equal('<h2>There were errors</h2><p>Unable to delete the payment link</p>')
    })
  })
})
