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
const GATEWAY_ACCOUNT_ID = 929

describe('make a demo payment - mock card details controller', () => {
  describe('when both paymentDescription and paymentAmount exist in the session', () => {
    let result, $, app

    before('Arrange', () => {
      const session = getMockSession(getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{name: 'transactions:read'}]
      }))
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, {
        payment_provider: 'sandbox'
      })
      lodash.set(session, 'pageData.makeADemoPayment', {
        paymentDescription: 'A demo payment',
        paymentAmount: '10.50'
      })
      app = createAppWithSession(getApp(), session)
    })

    before('Act', done => {
      supertest(app)
        .get(paths.prototyping.demoPayment.mockCardDetails)
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
      expect($('.link-back').attr('href')).to.equal(paths.prototyping.demoPayment.index)
    })

    it(`should include form which has the go to demo payment page as its action`, () => {
      expect($('form').attr('action')).to.equal(paths.prototyping.demoPayment.goToPaymentScreens)
    })
  })

  describe('when paymentDescription exists in the session but paymentAmount does not', () => {
    let result, app

    before('Arrange', () => {
      const session = getMockSession(getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{name: 'transactions:read'}]
      }))
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, {
        payment_provider: 'sandbox'
      })
      lodash.set(session, 'pageData.makeADemoPayment', {
        paymentDescription: 'A demo payment'
      })
      app = createAppWithSession(getApp(), session)
    })

    before('Act', done => {
      supertest(app)
        .get(paths.prototyping.demoPayment.mockCardDetails)
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
      expect(result.headers).to.have.property('location').to.equal(paths.prototyping.demoPayment.index)
    })
  })

  describe('when paymentAmount exists in the session but paymentAmount does not', () => {
    let result, app

    before('Arrange', () => {
      const session = getMockSession(getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{name: 'transactions:read'}]
      }))
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, {
        payment_provider: 'sandbox'
      })
      lodash.set(session, 'pageData.makeADemoPayment', {
        paymentAmount: '10.50'
      })
      app = createAppWithSession(getApp(), session)
    })

    before('Act', done => {
      supertest(app)
        .get(paths.prototyping.demoPayment.mockCardDetails)
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
      expect(result.headers).to.have.property('location').to.equal(paths.prototyping.demoPayment.index)
    })
  })

  describe('when there neither paymentDescription or paymentAmount exist in the session', () => {
    let result, app

    before('Arrange', () => {
      const session = getMockSession(getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{name: 'transactions:read'}]
      }))
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, {
        payment_provider: 'sandbox'
      })
      app = createAppWithSession(getApp(), session)
    })

    before('Act', done => {
      supertest(app)
        .get(paths.prototyping.demoPayment.mockCardDetails)
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
      expect(result.headers).to.have.property('location').to.equal(paths.prototyping.demoPayment.index)
    })
  })
})
