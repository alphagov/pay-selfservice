'use strict'

// NPM dependencies
const supertest = require('supertest')
const {expect} = require('chai')
const cheerio = require('cheerio')
const nock = require('nock')
const moment = require('moment-timezone')

// Local dependencies
const {getApp} = require('../../../server')
const {getMockSession, createAppWithSession, getUser} = require('../../../test/test_helpers/mock_session')
const paths = require('../../../app/paths')
const {CONNECTOR_URL} = process.env
const GATEWAY_ACCOUNT_ID = 929
const DASHBOARD_RESPONSE = {
  successful_payments: {
    count: 10,
    total_in_pence: 55000
  },
  refunded_payments: {
    count: 2,
    total_in_pence: 11000
  },
  net_income: {
    total_in_pence: 44000
  }
}

describe('dashboard-activity-controller', () => {
  describe('When the dashboard is successfully retrieved from connector', () => {
    describe('and the period is not set', () => {
      let result, $, app

      before('Arrange', () => {
        const session = getMockSession(getUser({
          gateway_account_ids: [GATEWAY_ACCOUNT_ID],
          permissions: [{name: 'transactions:read'}]
        }))

        nock(CONNECTOR_URL)
          .get(`/v1/api/accounts/${GATEWAY_ACCOUNT_ID}/transactions-summary`)
          .query(obj => {
            return obj.from_date === moment().tz('Europe/London').startOf('day').subtract(0, 'days').format()
          })
          .reply(200, DASHBOARD_RESPONSE)

        app = createAppWithSession(getApp(), session)
      })

      before('Act', done => {
        supertest(app)
          .get(paths.dashboard.index)
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

      it('it should default the period to today', () => {
        expect($('#activity-period option[selected]').val()).to.equal('today')
      })

      it('it should set the successful payments count', () => {
        expect($('.dashboard-total-group:nth-child(1) .dashboard-total-group__count').text())
          .to.equal('10')
      })

      it('it should set the successful payments amount in pounds', () => {
        expect($('.dashboard-total-group:nth-child(1) .dashboard-total-group__amount').text())
          .to.equal('£550.00')
      })

      it('it should set the refund payments count', () => {
        expect($('.dashboard-total-group:nth-child(2) .dashboard-total-group__count').text())
          .to.equal('2')
      })

      it('it should set the refund payments amount in pounds', () => {
        expect($('.dashboard-total-group:nth-child(2) .dashboard-total-group__amount').text())
          .to.equal('£110.00')
      })

      it('it should set the net income amount in pounds', () => {
        expect($('.dashboard-total-group:nth-child(3) .dashboard-total-group__amount').text())
          .to.equal('£440.00')
      })

      it('it should print the time period in the summary box', () => {
        expect($('.dashboard-total-explainer').text())
          .to.contain(moment().tz('Europe/London').startOf('day').subtract(0, 'days').format('D MMMM YYYY h:mm:ssa z'))
      })
    })
    describe('and the period is set to today explictly', () => {
      let result, $, app

      before('Arrange', () => {
        const session = getMockSession(getUser({
          gateway_account_ids: [GATEWAY_ACCOUNT_ID],
          permissions: [{name: 'transactions:read'}]
        }))

        nock(CONNECTOR_URL)
          .get(`/v1/api/accounts/${GATEWAY_ACCOUNT_ID}/transactions-summary`)
          .query(obj => {
            return obj.from_date === moment().tz('Europe/London').startOf('day').format()
          })
          .reply(200, DASHBOARD_RESPONSE)

        app = createAppWithSession(getApp(), session)
      })

      before('Act', done => {
        supertest(app)
          .get(paths.dashboard.index)
          .query({
            period: 'today'
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

      it('it should return a statusCode of 200', () => {
        expect(result.statusCode).to.equal(200)
      })

      it('it should select the period today', () => {
        expect($('#activity-period option[selected]').val()).to.equal('today')
      })

      it('it should print the time period in the summary box', () => {
        expect($('.dashboard-total-explainer').text())
          .to.contain(moment().tz('Europe/London').startOf('day').format('D MMMM YYYY h:mm:ssa z'))
      })
    })
    describe('and the period is set to yesterday', () => {
      let result, $, app

      before('Arrange', () => {
        const session = getMockSession(getUser({
          gateway_account_ids: [GATEWAY_ACCOUNT_ID],
          permissions: [{name: 'transactions:read'}]
        }))

        nock(CONNECTOR_URL)
          .get(`/v1/api/accounts/${GATEWAY_ACCOUNT_ID}/transactions-summary`)
          .query(obj => {
            return obj.from_date === moment().tz('Europe/London').startOf('day').subtract(1, 'days').format()
          })
          .reply(200, DASHBOARD_RESPONSE)

        app = createAppWithSession(getApp(), session)
      })

      before('Act', done => {
        supertest(app)
          .get(paths.dashboard.index)
          .query({
            period: 'yesterday'
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

      it('it should return a statusCode of 200', () => {
        expect(result.statusCode).to.equal(200)
      })

      it('it should select the period yesterday', () => {
        expect($('#activity-period option[selected]').val()).to.equal('yesterday')
      })

      it('it should print the time period in the summary box', () => {
        expect($('.dashboard-total-explainer').text())
          .to.contain(moment().tz('Europe/London').startOf('day').subtract(1, 'days').format('D MMMM YYYY h:mm:ssa z'))
      })
    })
    describe('and the period is set to previous 7 days', () => {
      let result, $, app

      before('Arrange', () => {
        const session = getMockSession(getUser({
          gateway_account_ids: [GATEWAY_ACCOUNT_ID],
          permissions: [{name: 'transactions:read'}]
        }))

        nock(CONNECTOR_URL)
          .get(`/v1/api/accounts/${GATEWAY_ACCOUNT_ID}/transactions-summary`)
          .query(obj => {
            return obj.from_date === moment().tz('Europe/London').startOf('day').subtract(8, 'days').format()
          })
          .reply(200, DASHBOARD_RESPONSE)

        app = createAppWithSession(getApp(), session)
      })

      before('Act', done => {
        supertest(app)
          .get(paths.dashboard.index)
          .query({
            period: 'previous-seven-days'
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

      it('it should return a statusCode of 200', () => {
        expect(result.statusCode).to.equal(200)
      })

      it('it should select the period previous-seven-days', () => {
        expect($('#activity-period option[selected]').val()).to.equal('previous-seven-days')
      })

      it('it should print the time period in the summary box', () => {
        expect($('.dashboard-total-explainer').text())
          .to.contain(moment().tz('Europe/London').startOf('day').subtract(8, 'days').format('D MMMM YYYY h:mm:ssa z'))
      })
    })
    describe('and the period is set to previous 30 days', () => {
      let result, $, app

      before('Arrange', () => {
        const session = getMockSession(getUser({
          gateway_account_ids: [GATEWAY_ACCOUNT_ID],
          permissions: [{name: 'transactions:read'}]
        }))

        nock(CONNECTOR_URL)
          .get(`/v1/api/accounts/${GATEWAY_ACCOUNT_ID}/transactions-summary`)
          .query(obj => {
            return obj.from_date === moment().tz('Europe/London').startOf('day').subtract(31, 'days').format()
          })
          .reply(200, DASHBOARD_RESPONSE)

        app = createAppWithSession(getApp(), session)
      })

      before('Act', done => {
        supertest(app)
          .get(paths.dashboard.index)
          .query({
            period: 'previous-thirty-days'
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

      it('it should return a statusCode of 200', () => {
        expect(result.statusCode).to.equal(200)
      })

      it('it should select the period previous-thirty-days', () => {
        expect($('#activity-period option[selected]').val()).to.equal('previous-thirty-days')
      })

      it('it should print the time period in the summary box', () => {
        expect($('.dashboard-total-explainer').text())
          .to.contain(moment().tz('Europe/London').startOf('day').subtract(31, 'days').format('D MMMM YYYY h:mm:ssa z'))
      })
    })
  })
  describe('When the dashboard has not been retrieved from connector', () => {
    let result, $, app

    before('Arrange', () => {
      const session = getMockSession(getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{name: 'transactions:read'}]
      }))

      nock(CONNECTOR_URL)
        .get(`/v1/api/accounts/${GATEWAY_ACCOUNT_ID}/transactions-summary`)
        .query(obj => {
          return obj.from_date === moment().tz('Europe/London').startOf('day').format()
        })
        .reply(404)

      app = createAppWithSession(getApp(), session)
    })

    before('Act', done => {
      supertest(app)
        .get(paths.dashboard.index)
        .end((err, res) => {
          result = res
          $ = cheerio.load(res.text)
          done(err)
        })
    })

    after(() => {
      nock.cleanAll()
    })

    it('it should return a statusCode of 404', () => {
      expect(result.statusCode).to.equal(404)
    })

    it('it should print the error message', () => {
      expect($('.dashboard-total-group__heading').text().trim())
        .to.equal('Error fetching totals')
    })
  })
})
