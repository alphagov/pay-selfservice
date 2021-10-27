'use strict'

const supertest = require('supertest')
const { expect } = require('chai')
const cheerio = require('cheerio')
const nock = require('nock')

const { getApp } = require('../../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../../test-helpers/mock-session')
const gatewayAccountFixtures = require('../../../fixtures/gateway-account.fixtures')
const { CONNECTOR_URL } = process.env
const { STRIPE_PORT, STRIPE_HOST } = process.env
const GATEWAY_ACCOUNT_ID = '929'
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'an-external-id'
const CREDENTIAL_EXTERNAL_ID = 'credential-external-id'

const yourPspPath = `/account/${GATEWAY_ACCOUNT_EXTERNAL_ID}/your-psp/${CREDENTIAL_EXTERNAL_ID}`

const mockConnectorGetGatewayAccount = (paymentProvider, type) => {
  nock(CONNECTOR_URL)
    .get(`/v1/frontend/accounts/external-id/${GATEWAY_ACCOUNT_EXTERNAL_ID}`)
    .reply(200, gatewayAccountFixtures.validGatewayAccountResponse({
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      external_id: GATEWAY_ACCOUNT_EXTERNAL_ID,
      type,
      gateway_account_credentials: [{
        payment_provider: 'stripe',
        external_id: CREDENTIAL_EXTERNAL_ID,
        credentials: { stripe_account_id: 'acct_123example123' }
      }],
      requires_additional_kyc_data: true
    }))
}

const mockStripeRetrieveAccount = () => {
  nock(`https://${STRIPE_HOST}:${STRIPE_PORT}`)
    .get(`/v1/accounts/acct_123example123`)
    .reply(200, {
      business_profile: {
        url: 'http://some-url'
      }
    })
    .persist()
}
const mockStripeListPersons = (phone) => {
  nock(`https://${STRIPE_HOST}:${STRIPE_PORT}`)
    .get(`/v1/accounts/acct_123example123/persons`)
    .reply(200, {
      data: [{
        id: 'person-1',
        relationship: {
          director: true
        }
      }, {
        id: 'person-2',
        relationship: {
          representative: true
        },
        phone: phone,
        email: 'test@example.org'
      }]
    })
    .persist()
}

describe('your-psp-controller', () => {
  describe('Your-PSP page for Stripe account', () => {
    describe('KYC data collection enabled', () => {
      let result, $, app

      before('Arrange', () => {
        const session = getMockSession(getUser({
          gateway_account_ids: [GATEWAY_ACCOUNT_ID],
          permissions: [{ name: 'gateway-credentials:read' }]
        }))

        mockConnectorGetGatewayAccount()
        mockStripeRetrieveAccount()
        mockStripeListPersons()

        app = createAppWithSession(getApp(), session)
      })

      before('Act', done => {
        supertest(app)
          .get(yourPspPath)
          .end((err, res) => {
            result = res
            $ = cheerio.load(res.text)

            done(err)
          })
      })

      after(() => {
        nock.cleanAll()
      })

      it('it should return a statusCode of 200', () => {
        expect(result.statusCode).to.equal(200)
      })

      it('should display director task as completed if available on Stripe', () => {
        expect($('#task-add-director-status').html())
          .to.equal('completed')
      })

      it('should display responsible person task as not start if details are not updated on Stripe', () => {
        expect($('#task-update-sro-status').html())
          .to.equal('not started')
      })

      it('should display organisation URL as completed if set on Stripe', () => {
        expect($('#task-organisation-url-status').html())
          .to.equal('completed')
      })
    })
    describe('KYC tasks completed', () => {
      let result, $, app

      before('Arrange', () => {
        const session = getMockSession(getUser({
          gateway_account_ids: [GATEWAY_ACCOUNT_ID],
          permissions: [{ name: 'gateway-credentials:read' }]
        }))

        mockConnectorGetGatewayAccount()
        mockStripeRetrieveAccount()
        mockStripeListPersons('0000000')

        app = createAppWithSession(getApp(), session)
      })

      before('Act', done => {
        supertest(app)
          .get(yourPspPath)
          .end((err, res) => {
            result = res
            $ = cheerio.load(res.text)

            done(err)
          })
      })

      after(() => {
        nock.cleanAll()
      })

      it('it should return a statusCode of 200', () => {
        expect(result.statusCode).to.equal(200)
      })

      it('should not display tasks on Your PSP - Stripe page', () => {
        expect($('.app-task-list').length).to.equal(0)
        expect($('#task-add-director-status').length).to.equal(0)
        expect($('#task-add-sro-status').length).to.equal(0)
        expect($('#task-organisation-url-status').length).to.equal(0)
      })
    })
  })
})
