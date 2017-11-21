'use strict'

// NPM dependencies
const supertest = require('supertest')
const {expect} = require('chai')
const cheerio = require('cheerio')
const lodash = require('lodash')
const csrf = require('csrf')
const nock = require('nock')

// Local dependencies
const {getApp} = require('../../../../server')
const {getMockSession, createAppWithSession, getUser} = require('../../../test_helpers/mock_session')
const paths = require('../../../../app/paths')

const GATEWAY_ACCOUNT_ID = 929
const {CONNECTOR_URL} = process.env
const VALID_USER = getUser({
  gateway_account_ids: [GATEWAY_ACCOUNT_ID],
  permissions: [{name: 'transactions:read'}]
})
const VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE = {
  payment_provider: 'sandbox'
}

describe('make a demo payment - index controller', () => {
  describe('when no values exist in the body and none are in session', () => {
    let result, $, session
    before(done => {
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE)
      session = getMockSession(VALID_USER)
      supertest(createAppWithSession(getApp(), session))
        .get(paths.prototyping.demoPayment.index)
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

    it(`should default to a payment amount of '20.00'`, () => {
      expect($(`#payment-amount`).text()).to.equal(`£${'20.00'}`)
    })

    it(`should default to a payment description of 'An example payment description'`, () => {
      expect($(`#payment-description`).text()).to.equal('An example payment description')
    })
  })
  describe('when values exist in the session but none are in the body', () => {
    let result, $, session, paymentAmount, paymentDescription
    before(done => {
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE)
      paymentAmount = '100.00'
      paymentDescription = 'Pay your window tax'
      session = getMockSession(VALID_USER)
      lodash.set(session, 'pageData.makeADemoPayment.paymentAmount', paymentAmount)
      lodash.set(session, 'pageData.makeADemoPayment.paymentDescription', paymentDescription)
      supertest(createAppWithSession(getApp(), session))
        .get(paths.prototyping.demoPayment.index)
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

    it(`should show the payment amount stored in the session`, () => {
      expect($(`#payment-amount`).text()).to.equal(`£${paymentAmount}`)
    })

    it(`should show the payment description stored in the session`, () => {
      expect($(`#payment-description`).text()).to.equal(paymentDescription)
    })
  })
  describe('when values exist in the body', () => {
    describe('and they are valid', () => {
      describe('and there are also values in the session', () => {
        let result, $, session, paymentAmount, paymentDescription
        before(done => {
          nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE)
          paymentAmount = '100.00'
          paymentDescription = 'Pay your window tax'
          session = getMockSession(VALID_USER)
          lodash.set(session, 'pageData.makeADemoPayment.paymentAmount', '180.00')
          lodash.set(session, 'pageData.makeADemoPayment.paymentDescription', 'Pay your door tax')
          supertest(createAppWithSession(getApp(), session))
            .post(paths.prototyping.demoPayment.index)
            .send({
              'csrfToken': csrf().create('123'),
              'payment-amount': paymentAmount,
              'payment-description': paymentDescription
            })
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

        it(`should show the payment amount from the body`, () => {
          expect($(`#payment-amount`).text()).to.equal(`£${paymentAmount}`)
        })

        it(`should show the payment description from the body`, () => {
          expect($(`#payment-description`).text()).to.equal(paymentDescription)
        })
      })
      describe('and there are no values in the session', () => {
        let result, $, session, paymentAmount, paymentDescription
        before(done => {
          nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE)
          paymentAmount = '100.00'
          paymentDescription = 'Pay your window tax'
          session = getMockSession(VALID_USER)
          supertest(createAppWithSession(getApp(), session))
            .post(paths.prototyping.demoPayment.index)
            .send({
              'csrfToken': csrf().create('123'),
              'payment-amount': paymentAmount,
              'payment-description': paymentDescription
            })
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

        it(`should show the payment amount from the body`, () => {
          expect($(`#payment-amount`).text()).to.equal(`£${paymentAmount}`)
        })

        it(`should show the payment description from the body`, () => {
          expect($(`#payment-description`).text()).to.equal(paymentDescription)
        })
      })
    })
    describe('but the payment amount is invalid', () => {
      describe('because the value includes text', () => {
        let result, session
        before(done => {
          nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE)
          session = getMockSession(VALID_USER)
          supertest(createAppWithSession(getApp(), session))
            .post(paths.prototyping.demoPayment.index)
            .send({
              'csrfToken': csrf().create('123'),
              'payment-amount': 'One Hundred and Eighty Pounds and No Pence',
              'payment-description': 'Pay your window tax'
            })
            .end((err, res) => {
              result = res
              done(err)
            })
        })

        after(() => {
          nock.cleanAll()
        })

        it('should redirect with a statusCode of 302', () => {
          expect(result.statusCode).to.equal(302)
        })
        it(`should redirect to the edit payment amount page`, () => {
          expect(result.headers).to.have.property('location').to.equal(paths.prototyping.demoPayment.editAmount)
        })
        it('should add a relevant error message to the session \'flash\'', () => {
          expect(session.flash).to.have.property('genericError')
          expect(session.flash.genericError.length).to.equal(1)
          expect(session.flash.genericError[0]).to.equal('<h2>Use valid characters only</h2> Choose an amount in pounds and pence using digits and a decimal point. For example “10.50”')
        })
      })
      describe('because the value has too many digits to the right of the decimal point', () => {
        let result, session
        before(done => {
          nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE)
          session = getMockSession(VALID_USER)
          supertest(createAppWithSession(getApp(), session))
            .post(paths.prototyping.demoPayment.index)
            .send({
              'csrfToken': csrf().create('123'),
              'payment-amount': '£1234.567',
              'payment-description': 'Pay your window tax'
            })
            .end((err, res) => {
              result = res
              done(err)
            })
        })

        after(() => {
          nock.cleanAll()
        })

        it('should redirect with a statusCode of 302', () => {
          expect(result.statusCode).to.equal(302)
        })
        it(`should redirect to the edit payment amount page`, () => {
          expect(result.headers).to.have.property('location').to.equal(paths.prototyping.demoPayment.editAmount)
        })
        it('should add a relevant error message to the session \'flash\'', () => {
          expect(session.flash).to.have.property('genericError')
          expect(session.flash.genericError.length).to.equal(1)
          expect(session.flash.genericError[0]).to.equal('<h2>Use valid characters only</h2> Choose an amount in pounds and pence using digits and a decimal point. For example “10.50”')
        })
      })
      describe('because the value exceeds 10,000,000', () => {
        let result, session, app
        before('Arrange', () => {
          nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE)
          session = getMockSession(VALID_USER)
          app = createAppWithSession(getApp(), session)
        })

        before('Act', done => {
          supertest(app)
            .post(paths.prototyping.demoPayment.index)
            .send({
              'csrfToken': csrf().create('123'),
              'payment-amount': '10000000.01',
              'payment-description': 'Pay your window tax'
            })
            .end((err, res) => {
              result = res
              done(err)
            })
        })

        after(() => {
          nock.cleanAll()
        })

        it('should redirect with a statusCode of 302', () => {
          expect(result.statusCode).to.equal(302)
        })
        it(`should redirect to the edit payment amount page`, () => {
          expect(result.headers).to.have.property('location').to.equal(paths.prototyping.demoPayment.editAmount)
        })
        it('should add a relevant error message to the session \'flash\'', () => {
          expect(session.flash).to.have.property('genericError')
          expect(session.flash.genericError.length).to.equal(1)
          expect(session.flash.genericError[0]).to.equal('<h2>Enter a valid amount</h2> Choose an amount under £10,000,000')
        })
      })
    })
  })
})
