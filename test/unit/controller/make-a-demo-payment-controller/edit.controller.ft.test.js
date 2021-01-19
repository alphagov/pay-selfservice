'use strict'

const supertest = require('supertest')
const { expect } = require('chai')
const cheerio = require('cheerio')
const lodash = require('lodash')
const nock = require('nock')

const { getApp } = require('../../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../../test-helpers/mock-session')
const paths = require('../../../../app/paths')
const { penceToPounds } = require('../../../../app/utils/currency-formatter')
const formatAccountPathsFor = require('../../../../app/utils/format-account-paths-for')
const { validGatewayAccountResponse } = require('../../../fixtures/gateway-account.fixtures')

const GATEWAY_ACCOUNT_ID = '929'
const EXTERNAL_GATEWAY_ACCOUNT_ID = 'an-external-id'
const { CONNECTOR_URL } = process.env
const VALID_USER = getUser({
  gateway_account_ids: [GATEWAY_ACCOUNT_ID],
  permissions: [{ name: 'transactions:read' }]
})

function mockConnectorGetAccount () {
  nock(CONNECTOR_URL).get(`/v1/frontend/accounts/external-id/${EXTERNAL_GATEWAY_ACCOUNT_ID}`)
    .reply(200, validGatewayAccountResponse(
      {
        external_id: EXTERNAL_GATEWAY_ACCOUNT_ID,
        gateway_account_id: GATEWAY_ACCOUNT_ID
      }
    ))
}

describe('make a demo payment - edit controller', () => {
  describe(`when the path navigated to is the 'edit amount' path`, () => {
    let result, $, session, paymentAmount
    before(done => {
      mockConnectorGetAccount()
      paymentAmount = '10000'
      session = getMockSession(VALID_USER)
      lodash.set(session, 'pageData.makeADemoPayment.paymentAmount', paymentAmount)
      supertest(createAppWithSession(getApp(), session))
        .get(formatAccountPathsFor(paths.account.prototyping.demoPayment.editAmount, EXTERNAL_GATEWAY_ACCOUNT_ID))
        .end((err, res) => {
          result = res
          $ = cheerio.load(res.text)
          done(err)
        })
    })

    after(() => {
      nock.cleanAll()
    })

    it('should return with a statusCode of 200', () => {
      expect(result.statusCode).to.equal(200)
    })

    it('should render the edit amount page', () => {
      expect($('h1').text()).to.equal('Edit payment amount')
    })

    it('should have a back button that takes the user back to the demo payment index page', () => {
      expect($('.govuk-back-link').attr('href')).to.equal(formatAccountPathsFor(paths.account.prototyping.demoPayment.index, EXTERNAL_GATEWAY_ACCOUNT_ID))
    })

    it(`should set the 'payment-amount' value to be that found in the session`, () => {
      const paymentAmountInPounds = penceToPounds(paymentAmount)
      expect($(`input[name='payment-amount']`).val()).to.equal(paymentAmountInPounds)
    })
  })
  describe(`when the path navigated to is the 'edit description' path`, () => {
    let result, $, session, paymentDescription
    before(done => {
      mockConnectorGetAccount()
      paymentDescription = 'Pay your window tax'
      session = getMockSession(VALID_USER)
      lodash.set(session, 'pageData.makeADemoPayment.paymentDescription', paymentDescription)
      supertest(createAppWithSession(getApp(), session))
        .get(formatAccountPathsFor(paths.account.prototyping.demoPayment.editDescription, EXTERNAL_GATEWAY_ACCOUNT_ID))
        .end((err, res) => {
          result = res
          $ = cheerio.load(res.text)
          done(err)
        })
    })

    after(() => {
      nock.cleanAll()
    })

    it('should return with a statusCode of 200', () => {
      expect(result.statusCode).to.equal(200)
    })

    it('should render the edit amount page', () => {
      expect($('h1').text()).to.equal('Edit payment description')
    })

    it('should have a back button that takes the user back to the demo payment index page', () => {
      expect($('.govuk-back-link').attr('href')).to.equal(formatAccountPathsFor(paths.account.prototyping.demoPayment.index, EXTERNAL_GATEWAY_ACCOUNT_ID))
    })

    it(`should set the 'payment-description' value to be that found in the session`, () => {
      expect($(`textarea[name='payment-description']`).val()).to.equal(paymentDescription)
    })
  })
})
