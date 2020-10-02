'use strict'

const supertest = require('supertest')
const nock = require('nock')
const cheerio = require('cheerio')

const paths = require('../../app/paths')
const { validGatewayAccountResponse } = require('../fixtures/gateway-account.fixtures')
const { buildGetStripeAccountSetupResponse } = require('../fixtures/stripe-account-setup.fixtures')

const connectorMock = nock(process.env.CONNECTOR_URL)
const GATEWAY_ACCOUNT_ID = 111

const { getApp } = require('../../server')
const { getMockSession, createAppWithSession, getUser } = require('../test-helpers/mock-session')

describe('Add stripe psp details route', () => {
  describe('All setup steps complete', () => {
    let app

    afterEach(() => nock.cleanAll())

    beforeEach(() => {
      const session = getMockSession(getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{ name: 'stripe-account-details:update' }]
      }))

      app = createAppWithSession(getApp(), session)

      connectorMock
        .get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`)
        .reply(200, validGatewayAccountResponse({
          gateway_account_id: GATEWAY_ACCOUNT_ID,
          payment_provider: 'stripe',
          type: 'live'
        }).getPlain())

      connectorMock
        .get(`/v1/api/accounts/${GATEWAY_ACCOUNT_ID}/stripe-setup`)
        .reply(200, buildGetStripeAccountSetupResponse({
          bank_account: true,
          responsible_person: true,
          vat_number: true,
          company_number: true
        }).getPlain())
        .persist()
    })

    it('should load the "Go live complete" page', async () => {
      const res = await supertest(app)
        .get(paths.stripe.addPspAccountDetails)
      const $ = cheerio.load(res.text)
      expect(res.statusCode).toBe(200)
      expect($('h1').text()).toEqual(expect.arrayContaining(['Go live complete']))
    })
  })
})
