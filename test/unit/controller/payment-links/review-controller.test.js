'use strict'

// NPM dependencies
const supertest = require('supertest')
const {expect} = require('chai')
const cheerio = require('cheerio')
const nock = require('nock')
const lodash = require('lodash')

// Local dependencies
const {getApp} = require('../../../../server')
const {getMockSession, createAppWithSession, getUser} = require('../../../test_helpers/mock_session')
const paths = require('../../../../app/paths')
const {CONNECTOR_URL} = process.env
const GATEWAY_ACCOUNT_ID = '929'

describe('Create payment link review controller', () => {
  describe('when landing here after completing journey', () => {
    let result, $, session
    before(done => {
      const user = getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{name: 'transactions:read'}]
      })
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, {
        payment_provider: 'sandbox'
      })
      session = getMockSession(user)
      lodash.set(session, 'pageData.createPaymentLink', {
        paymentLinkTitle: 'Pay for an offline service',
        paymentLinkDescription: 'Hello world'
      })
      supertest(createAppWithSession(getApp(), session))
        .get(paths.paymentLinks.createReview)
        .end((err, res) => {
          result = res
          $ = cheerio.load(res.text)
          done(err)
        })
    })
    after(() => {
      nock.cleanAll()
    })

    it('should return a statusCode of 200', () => {
      expect(result.statusCode).to.equal(200)
    })

    it(`should include a cancel link linking to the Create payment link index`, () => {
      expect($('.cancel').attr('href')).to.equal(paths.paymentLinks.index)
    })

    it(`should include link to change title`, () => {
      expect($('.review-title .cya-change a').attr('href')).to.equal(`${paths.paymentLinks.createInformation}?field=payment-link-title`)
    })

    it(`should include link to change description`, () => {
      expect($('.review-details .cya-change a').attr('href')).to.equal(`${paths.paymentLinks.createInformation}?field=payment-link-description`)
    })

    it(`should display the Title in the definition list`, () =>
      expect($(`.review-title .cya-answer`).text()).to.contain(session.pageData.createPaymentLink.paymentLinkTitle)
    )

    it(`should display some details in the definition list`, () =>
      expect($(`.review-details .cya-answer`).text()).to.contain(session.pageData.createPaymentLink.paymentLinkDescription)
    )
  })
})
