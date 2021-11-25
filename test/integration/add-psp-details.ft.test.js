'use strict'

const supertest = require('supertest')
const nock = require('nock')
const cheerio = require('cheerio')
const { expect } = require('chai')

const paths = require('../../app/paths')
const { validGatewayAccountResponse } = require('../fixtures/gateway-account.fixtures')
const { buildGetStripeAccountSetupResponse } = require('../fixtures/stripe-account-setup.fixtures')

const connectorMock = nock(process.env.CONNECTOR_URL)
const GATEWAY_ACCOUNT_ID = '111'
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'a-valid-external-id'
const { getApp } = require('../../server')
const { getMockSession, createAppWithSession, getUser } = require('../test-helpers/mock-session')

describe('Add stripe psp details route', function () {
  describe('All setup steps complete', () => {
    let app

    afterEach(() => nock.cleanAll())

    beforeEach(function () {
      const session = getMockSession(getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{ name: 'stripe-account-details:update' }]
      }))

      app = createAppWithSession(getApp(), session)

      connectorMock
        .get(`/v1/frontend/accounts/external-id/${GATEWAY_ACCOUNT_EXTERNAL_ID}`)
        .reply(200, validGatewayAccountResponse({
          gateway_account_id: GATEWAY_ACCOUNT_ID,
          external_id: GATEWAY_ACCOUNT_EXTERNAL_ID,
          payment_provider: 'stripe',
          type: 'live',
          gateway_account_credentials: [{
            external_id: 'valid-credentials-id',
            payment_provider: 'stripe'
          }]
        }))

      connectorMock
        .get(`/v1/api/accounts/${GATEWAY_ACCOUNT_ID}/stripe-setup`)
        .reply(200, buildGetStripeAccountSetupResponse({
          bank_account: true,
          responsible_person: true,
          vat_number: true,
          company_number: true,
          director: true
        }))
        .persist()
    })

    it('should load the "Go live complete" page', async () => {
      const url = `/account/a-valid-external-id${paths.account.stripe.addPspAccountDetails}`
      const res = await supertest(app)
        .get(url)
      const $ = cheerio.load(res.text)
      expect(res.statusCode).to.equal(200)
      expect($('h1').text()).to.contain('Go live complete')
    })
  })
})
