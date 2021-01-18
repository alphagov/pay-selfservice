'use strict'

const supertest = require('supertest')
const { expect } = require('chai')
const cheerio = require('cheerio')
const lodash = require('lodash')
const csrf = require('csrf')
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
  nock(CONNECTOR_URL).get(`/v1/api/accounts/external-id/${EXTERNAL_GATEWAY_ACCOUNT_ID}`)
    .reply(200, validGatewayAccountResponse(
      {
        external_id: EXTERNAL_GATEWAY_ACCOUNT_ID,
        gateway_account_id: GATEWAY_ACCOUNT_ID
      }
    ))
}

describe('make a demo payment - index controller', () => {
  describe('when no values exist in the body and none are in session', () => {
    let result, $, session
    before(done => {
      mockConnectorGetAccount()
      session = getMockSession(VALID_USER)
      supertest(createAppWithSession(getApp(), session))
        .get(formatAccountPathsFor(paths.account.prototyping.demoPayment.index, EXTERNAL_GATEWAY_ACCOUNT_ID))
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
      expect($(`#payment-amount`).text()).to.contain(`£${'20.00'}`)
    })

    it(`should default to a payment description of 'An example payment description'`, () => {
      expect($(`#payment-description`).text()).to.contain('An example payment description')
    })
  })
  describe('when values exist in the session but none are in the body', () => {
    let result, $, session, paymentAmount, paymentDescription
    before(done => {
      mockConnectorGetAccount()
      paymentAmount = '10000'
      paymentDescription = 'Pay your window tax'
      session = getMockSession(VALID_USER)
      lodash.set(session, 'pageData.makeADemoPayment.paymentAmount', paymentAmount)
      lodash.set(session, 'pageData.makeADemoPayment.paymentDescription', paymentDescription)
      supertest(createAppWithSession(getApp(), session))
        .get(formatAccountPathsFor(paths.account.prototyping.demoPayment.index, EXTERNAL_GATEWAY_ACCOUNT_ID))
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
      const paymentAmountInPounds = penceToPounds(paymentAmount)
      expect($(`#payment-amount`).text()).to.contain(`£${paymentAmountInPounds}`)
    })

    it(`should show the payment description stored in the session`, () => {
      expect($(`#payment-description`).text()).to.contain(paymentDescription)
    })
  })
  describe('when values exist in the body', () => {
    describe('and they are valid', () => {
      describe('and there are also values in the session', () => {
        let result, $, session, paymentAmount, paymentDescription
        before(done => {
          mockConnectorGetAccount()
          paymentAmount = '100.00'
          paymentDescription = 'Pay your window tax'
          session = getMockSession(VALID_USER)
          lodash.set(session, 'pageData.makeADemoPayment.paymentAmount', '180.00')
          lodash.set(session, 'pageData.makeADemoPayment.paymentDescription', 'Pay your door tax')
          supertest(createAppWithSession(getApp(), session))
            .post(formatAccountPathsFor(paths.account.prototyping.demoPayment.index, EXTERNAL_GATEWAY_ACCOUNT_ID))
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
          expect($(`#payment-amount`).text()).to.contain(`£${paymentAmount}`)
        })

        it(`should show the payment description from the body`, () => {
          expect($(`#payment-description`).text()).to.contain(paymentDescription)
        })
      })
      describe('and there are no values in the session', () => {
        let result, $, session, paymentAmount, paymentDescription
        before(done => {
          mockConnectorGetAccount()
          paymentAmount = '100.00'
          paymentDescription = 'Pay your window tax'
          session = getMockSession(VALID_USER)
          supertest(createAppWithSession(getApp(), session))
            .post(formatAccountPathsFor(paths.account.prototyping.demoPayment.index, EXTERNAL_GATEWAY_ACCOUNT_ID))
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
          expect($(`#payment-amount`).text()).to.contain(`£${paymentAmount}`)
        })

        it(`should show the payment description from the body`, () => {
          expect($(`#payment-description`).text()).to.contain(paymentDescription)
        })
      })
    })
    describe('but the payment amount is invalid', () => {
      describe('because the value includes text', () => {
        let result, session
        before(done => {
          mockConnectorGetAccount()
          session = getMockSession(VALID_USER)
          supertest(createAppWithSession(getApp(), session))
            .post(formatAccountPathsFor(paths.account.prototyping.demoPayment.index, EXTERNAL_GATEWAY_ACCOUNT_ID))
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
          expect(result.headers).to.have.property('location').to.equal(formatAccountPathsFor(paths.account.prototyping.demoPayment.editAmount, EXTERNAL_GATEWAY_ACCOUNT_ID))
        })
        it('should add a relevant error message to the session \'flash\'', () => {
          expect(session.flash).to.have.property('genericError')
          expect(session.flash.genericError.length).to.equal(1)
          expect(session.flash.genericError[0]).to.equal('Enter an amount in pounds and pence using digits and a decimal point. For example “10.50”')
        })
      })
      describe('because the value has too many digits to the right of the decimal point', () => {
        let result, session
        before(done => {
          mockConnectorGetAccount()
          session = getMockSession(VALID_USER)
          supertest(createAppWithSession(getApp(), session))
            .post(formatAccountPathsFor(paths.account.prototyping.demoPayment.index, EXTERNAL_GATEWAY_ACCOUNT_ID))
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
          expect(result.headers).to.have.property('location').to.equal(formatAccountPathsFor(paths.account.prototyping.demoPayment.editAmount, EXTERNAL_GATEWAY_ACCOUNT_ID))
        })
        it('should add a relevant error message to the session \'flash\'', () => {
          expect(session.flash).to.have.property('genericError')
          expect(session.flash.genericError.length).to.equal(1)
          expect(session.flash.genericError[0]).to.equal('Enter an amount in pounds and pence using digits and a decimal point. For example “10.50”')
        })
      })
      describe('because the value exceeds 100,000', () => {
        let result, session, app
        before('Arrange', () => {
          mockConnectorGetAccount()
          session = getMockSession(VALID_USER)
          app = createAppWithSession(getApp(), session)
        })

        before('Act', done => {
          supertest(app)
            .post(formatAccountPathsFor(paths.account.prototyping.demoPayment.index, EXTERNAL_GATEWAY_ACCOUNT_ID))
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
          expect(result.headers).to.have.property('location').to.equal(formatAccountPathsFor(paths.account.prototyping.demoPayment.editAmount, EXTERNAL_GATEWAY_ACCOUNT_ID))
        })
        it('should add a relevant error message to the session \'flash\'', () => {
          expect(session.flash).to.have.property('genericError')
          expect(session.flash.genericError.length).to.equal(1)
          expect(session.flash.genericError[0]).to.equal('Enter an amount under £100,000')
        })
      })
    })
  })
})
