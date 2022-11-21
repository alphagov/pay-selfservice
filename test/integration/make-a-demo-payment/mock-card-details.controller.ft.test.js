'use strict'

const supertest = require('supertest')
const { expect } = require('chai')
const cheerio = require('cheerio')
const nock = require('nock')
const lodash = require('lodash')

const { getApp } = require('../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../test-helpers/mock-session')
const paths = require('../../../app/paths')
const formatAccountPathsFor = require('../../../app/utils/format-account-paths-for')
const { validGatewayAccountResponse } = require('../../fixtures/gateway-account.fixtures')

const { CONNECTOR_URL } = process.env
const GATEWAY_ACCOUNT_ID = '929'
const EXTERNAL_GATEWAY_ACCOUNT_ID = 'an-external-id'

function mockConnectorGetAccount () {
  nock(CONNECTOR_URL).get(`/v1/frontend/accounts/external-id/${EXTERNAL_GATEWAY_ACCOUNT_ID}`)
    .reply(200, validGatewayAccountResponse(
      {
        external_id: EXTERNAL_GATEWAY_ACCOUNT_ID,
        gateway_account_id: GATEWAY_ACCOUNT_ID
      }
    ))
}

describe('make a demo payment - mock card details controller', () => {
  describe('when both paymentDescription and paymentAmount exist in the session', () => {
    let result, $, app

    before('Arrange', () => {
      const session = getMockSession(getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{ name: 'transactions:read' }]
      }))
      mockConnectorGetAccount()
      lodash.set(session, 'pageData.makeADemoPayment', {
        paymentDescription: 'A demo payment',
        paymentAmount: '10.50'
      })
      app = createAppWithSession(getApp(), session)
    })

    before('Act', done => {
      supertest(app)
        .get(formatAccountPathsFor(paths.account.prototyping.demoPayment.mockCardDetails, EXTERNAL_GATEWAY_ACCOUNT_ID))
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

    it(`should include a back link linking to the demoservice index page`, () => {
      expect($('.govuk-back-link').attr('href')).to.equal(formatAccountPathsFor(paths.account.prototyping.demoPayment.index, EXTERNAL_GATEWAY_ACCOUNT_ID))
    })

    it(`should include form which has the go to demo payment page as its action`, () => {
      expect($('form').attr('action')).to.equal(formatAccountPathsFor(paths.account.prototyping.demoPayment.goToPaymentScreens, EXTERNAL_GATEWAY_ACCOUNT_ID))
    })
  })

  describe('when paymentDescription exists in the session but paymentAmount does not', () => {
    let result, app

    before('Arrange', () => {
      const session = getMockSession(getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{ name: 'transactions:read' }]
      }))
      mockConnectorGetAccount()
      lodash.set(session, 'pageData.makeADemoPayment', {
        paymentDescription: 'A demo payment'
      })
      app = createAppWithSession(getApp(), session)
    })

    before('Act', done => {
      supertest(app)
        .get(formatAccountPathsFor(paths.account.prototyping.demoPayment.mockCardDetails, EXTERNAL_GATEWAY_ACCOUNT_ID))
        .end((err, res) => {
          result = res
          done(err)
        })
    })

    after(() => {
      nock.cleanAll()
    })

    it('should return a statusCode of 302', () => {
      expect(result.statusCode).to.equal(302)
    })

    it('should redirect back to the index page', () => {
      expect(result.headers).to.have.property('location').to.equal(formatAccountPathsFor(paths.account.prototyping.demoPayment.index, EXTERNAL_GATEWAY_ACCOUNT_ID))
    })
  })

  describe('when paymentAmount exists in the session but paymentAmount does not', () => {
    let result, app

    before('Arrange', () => {
      const session = getMockSession(getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{ name: 'transactions:read' }]
      }))
      mockConnectorGetAccount()
      lodash.set(session, 'pageData.makeADemoPayment', {
        paymentAmount: '10.50'
      })
      app = createAppWithSession(getApp(), session)
    })

    before('Act', done => {
      supertest(app)
        .get(formatAccountPathsFor(paths.account.prototyping.demoPayment.mockCardDetails, EXTERNAL_GATEWAY_ACCOUNT_ID))
        .end((err, res) => {
          result = res
          done(err)
        })
    })

    after(() => {
      nock.cleanAll()
    })

    it('should return a statusCode of 302', () => {
      expect(result.statusCode).to.equal(302)
    })

    it('should redirect back to the index page', () => {
      expect(result.headers).to.have.property('location').to.equal(formatAccountPathsFor(paths.account.prototyping.demoPayment.index, EXTERNAL_GATEWAY_ACCOUNT_ID))
    })
  })

  describe('when there neither paymentDescription or paymentAmount exist in the session', () => {
    let result, app

    before('Arrange', () => {
      const session = getMockSession(getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{ name: 'transactions:read' }]
      }))
      mockConnectorGetAccount()
      app = createAppWithSession(getApp(), session)
    })

    before('Act', done => {
      supertest(app)
        .get(formatAccountPathsFor(paths.account.prototyping.demoPayment.mockCardDetails, EXTERNAL_GATEWAY_ACCOUNT_ID))
        .end((err, res) => {
          result = res
          done(err)
        })
    })

    after(() => {
      nock.cleanAll()
    })

    it('should return a statusCode of 302', () => {
      expect(result.statusCode).to.equal(302)
    })

    it('should redirect back to the index page', () => {
      expect(result.headers).to.have.property('location').to.equal(formatAccountPathsFor(paths.account.prototyping.demoPayment.index, EXTERNAL_GATEWAY_ACCOUNT_ID))
    })
  })
})
