'use strict'

// NPM dependencies
const supertest = require('supertest')
const {expect} = require('chai')
const nock = require('nock')

// Local dependencies
const {getApp} = require('../../../../server')
const {getMockSession, createAppWithSession, getUser} = require('../../../test_helpers/mock_session')
const paths = require('../../../../app/paths')
const {randomUuid} = require('../../../../app/utils/random')

const GATEWAY_ACCOUNT_ID = 929
const {PRODUCTS_URL, CONNECTOR_URL} = process.env

describe('test with your users - disable controller', () => {
  describe('when the prototype link is successfully disabled', () => {
    let response, session
    before(done => {
      const productExternalId = randomUuid()
      const user = getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{name: 'transactions:read'}]
      })
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, {
        payment_provider: 'sandbox'
      })
      nock(PRODUCTS_URL).patch(`/v1/api/products/${productExternalId}/disable`).reply(200)
      session = getMockSession(user)
      supertest(createAppWithSession(getApp(), session))
        .get(paths.prototyping.demoService.disable.replace(':productExternalId', productExternalId))
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

    it('should redirect to the create prototype link page', () => {
      expect(response.header).to.have.property('location').to.equal(paths.prototyping.demoService.links)
    })

    it('should add a relevant generic message to the session \'flash\'', () => {
      expect(session.flash).to.have.property('generic')
      expect(session.flash.generic.length).to.equal(1)
      expect(session.flash.generic[0]).to.equal('<p>Prototype link deleted</p>')
    })
  })

  describe('when disabling the prototype link fails', () => {
    let response, session
    before(done => {
      const productExternalId = randomUuid()
      const user = getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{name: 'transactions:read'}]
      })
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, {
        payment_provider: 'sandbox'
      })
      nock(PRODUCTS_URL).patch(`/v1/api/products/${productExternalId}/disable`)
        .replyWithError('Ruhroh! Something terrible has happened Shaggy!')
      session = getMockSession(user)
      supertest(createAppWithSession(getApp(), session))
        .get(paths.prototyping.demoService.disable.replace(':productExternalId', productExternalId))
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

    it('should redirect to the create prototype link page', () => {
      expect(response.header).to.have.property('location').to.equal(paths.prototyping.demoService.links)
    })

    it('should add a relevant error message to the session \'flash\'', () => {
      expect(session.flash).to.have.property('genericError')
      expect(session.flash.genericError.length).to.equal(1)
      expect(session.flash.genericError[0]).to.equal('<p>Unable to delete prototype link</p>')
    })
  })
})
