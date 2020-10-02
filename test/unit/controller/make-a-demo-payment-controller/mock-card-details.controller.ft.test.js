'use strict'

const supertest = require('supertest')
const cheerio = require('cheerio')
const nock = require('nock')
const lodash = require('lodash')

const { getApp } = require('../../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../../test-helpers/mock-session')
const paths = require('../../../../app/paths')
const { CONNECTOR_URL } = process.env
const GATEWAY_ACCOUNT_ID = '929'

describe('make a demo payment - mock card details controller', () => {
  describe('when both paymentDescription and paymentAmount exist in the session', () => {
    let result, $, app

    beforeAll(() => {
      const session = getMockSession(getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{ name: 'transactions:read' }]
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

    beforeAll(done => {
      supertest(app)
        .get(paths.prototyping.demoPayment.mockCardDetails)
        .end((err, res) => {
          result = res
          $ = cheerio.load(res.text)
          done(err)
        })
    })

    afterAll(() => {
      nock.cleanAll()
    })

    it('should return a statusCode of 200', () => {
      expect(result.statusCode).toBe(200)
    })

    it(
      `should include a back link linking to the demoservice index page`,
      () => {
        expect($('.govuk-back-link').attr('href')).toBe(paths.prototyping.demoPayment.index)
      }
    )

    it(
      `should include form which has the go to demo payment page as its action`,
      () => {
        expect($('form').attr('action')).toBe(paths.prototyping.demoPayment.goToPaymentScreens)
      }
    )
  })

  describe('when paymentDescription exists in the session but paymentAmount does not', () => {
    let result, app

    beforeAll(() => {
      const session = getMockSession(getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{ name: 'transactions:read' }]
      }))
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, {
        payment_provider: 'sandbox'
      })
      lodash.set(session, 'pageData.makeADemoPayment', {
        paymentDescription: 'A demo payment'
      })
      app = createAppWithSession(getApp(), session)
    })

    beforeAll(done => {
      supertest(app)
        .get(paths.prototyping.demoPayment.mockCardDetails)
        .end((err, res) => {
          result = res
          done(err)
        })
    })

    afterAll(() => {
      nock.cleanAll()
    })

    it('should return a statusCode of 302', () => {
      expect(result.statusCode).toBe(302)
    })

    it('should redirect back to the index page', () => {
      expect(result.headers).to.have.property('location').toBe(paths.prototyping.demoPayment.index)
    })
  })

  describe('when paymentAmount exists in the session but paymentAmount does not', () => {
    let result, app

    beforeAll(() => {
      const session = getMockSession(getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{ name: 'transactions:read' }]
      }))
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, {
        payment_provider: 'sandbox'
      })
      lodash.set(session, 'pageData.makeADemoPayment', {
        paymentAmount: '10.50'
      })
      app = createAppWithSession(getApp(), session)
    })

    beforeAll(done => {
      supertest(app)
        .get(paths.prototyping.demoPayment.mockCardDetails)
        .end((err, res) => {
          result = res
          done(err)
        })
    })

    afterAll(() => {
      nock.cleanAll()
    })

    it('should return a statusCode of 302', () => {
      expect(result.statusCode).toBe(302)
    })

    it('should redirect back to the index page', () => {
      expect(result.headers).to.have.property('location').toBe(paths.prototyping.demoPayment.index)
    })
  })

  describe('when there neither paymentDescription or paymentAmount exist in the session', () => {
    let result, app

    beforeAll(() => {
      const session = getMockSession(getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{ name: 'transactions:read' }]
      }))
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, {
        payment_provider: 'sandbox'
      })
      app = createAppWithSession(getApp(), session)
    })

    beforeAll(done => {
      supertest(app)
        .get(paths.prototyping.demoPayment.mockCardDetails)
        .end((err, res) => {
          result = res
          done(err)
        })
    })

    afterAll(() => {
      nock.cleanAll()
    })

    it('should return a statusCode of 302', () => {
      expect(result.statusCode).toBe(302)
    })

    it('should redirect back to the index page', () => {
      expect(result.headers).to.have.property('location').toBe(paths.prototyping.demoPayment.index)
    })
  })
})
