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
const EXTERNAL_GATEWAY_ACCOUNT_ID = 'an-external-id'

const { PRODUCTS_URL, CONNECTOR_URL } = process.env
const formatAccountPathsFor = require('../../../../app/utils/format-account-paths-for')

function mockConnectorGetAccount () {
  nock(CONNECTOR_URL).get(`/v1/api/accounts/external-id/${EXTERNAL_GATEWAY_ACCOUNT_ID}`)
    .reply(200, validGatewayAccountResponse(
      {
        external_id: EXTERNAL_GATEWAY_ACCOUNT_ID,
        gateway_account_id: GATEWAY_ACCOUNT_ID
      }
    ))
}

describe('test with your users - disable controller', () => {
  describe('when the prototype link is successfully disabled', () => {
    let response, session
    before(done => {
      const productExternalId = randomUuid()
      const user = getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{ name: 'transactions:read' }]
      })
      mockConnectorGetAccount()
      nock(PRODUCTS_URL).patch(`/v1/api/gateway-account/${GATEWAY_ACCOUNT_ID}/products/${productExternalId}/disable`).reply(200)
      session = getMockSession(user)
      supertest(createAppWithSession(getApp(), session))
        .get(formatAccountPathsFor(paths.account.prototyping.demoService.disable, EXTERNAL_GATEWAY_ACCOUNT_ID).replace(':productExternalId', productExternalId))
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
      expect(response.header).to.have.property('location').to.equal(formatAccountPathsFor(paths.account.prototyping.demoService.links, EXTERNAL_GATEWAY_ACCOUNT_ID))
    })

    it('should add a relevant generic message to the session \'flash\'', () => {
      expect(session.flash).to.have.property('generic')
      expect(session.flash.generic.length).to.equal(1)
      expect(session.flash.generic[0]).to.equal('Prototype link deleted')
    })
  })

  describe('when disabling the prototype link fails', () => {
    let response, session
    before(done => {
      const productExternalId = randomUuid()
      const user = getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{ name: 'transactions:read' }]
      })
      mockConnectorGetAccount()
      nock(PRODUCTS_URL).patch(`/v1/api/products/${productExternalId}/disable`)
        .replyWithError('Ruhroh! Something terrible has happened Shaggy!')
      session = getMockSession(user)
      supertest(createAppWithSession(getApp(), session))
        .get(formatAccountPathsFor(paths.account.prototyping.demoService.disable, EXTERNAL_GATEWAY_ACCOUNT_ID).replace(':productExternalId', productExternalId))
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
      expect(response.header).to.have.property('location').to.equal(formatAccountPathsFor(paths.account.prototyping.demoService.links, EXTERNAL_GATEWAY_ACCOUNT_ID))
    })

    it('should add a relevant error message to the session \'flash\'', () => {
      expect(session.flash).to.have.property('genericError')
      expect(session.flash.genericError.length).to.equal(1)
      expect(session.flash.genericError[0]).to.equal('Something went wrong when deleting the prototype link. Please try again or contact support.')
    })
  })
})
