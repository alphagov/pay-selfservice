'use strict'

const supertest = require('supertest')
const { expect } = require('chai')
const cheerio = require('cheerio')
const nock = require('nock')
const moment = require('moment-timezone')

const { getApp } = require('../../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../../test-helpers/mock-session')
const paths = require('../../../../app/paths')
const gatewayAccountFixtures = require('../../../fixtures/gateway-account.fixtures')
const { CONNECTOR_URL } = process.env
const { LEDGER_URL } = process.env
const { STRIPE_PORT, STRIPE_HOST } = process.env
const GATEWAY_ACCOUNT_ID = '929'
const DASHBOARD_RESPONSE = {
  payments: {
    count: 10,
    gross_amount: 55000
  },
  refunds: {
    count: 2,
    gross_amount: 11000
  },
  net_income: 44000
}
let app

const mockConnectorGetGatewayAccount = (paymentProvider, type) => {
  nock(CONNECTOR_URL)
    .get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`)
    .reply(200, gatewayAccountFixtures.validGatewayAccountResponse({
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      payment_provider: paymentProvider,
      type: type
    }).getPlain())
}

const mockConnectorGetStripeSetup = (bankAccount, responsiblePerson, vatNumber, companyNumber) => {
  nock(CONNECTOR_URL)
    .get(`/v1/api/accounts/${GATEWAY_ACCOUNT_ID}/stripe-setup`)
    .reply(200, {
      bank_account: bankAccount,
      responsible_person: responsiblePerson,
      vat_number: vatNumber,
      company_number: companyNumber
    })
    .persist()
}

const mockConnectorGetStripeAccount = () => {
  nock(CONNECTOR_URL)
    .get(`/v1/api/accounts/${GATEWAY_ACCOUNT_ID}/stripe-account`)
    .reply(200, {
      'stripe_account_id': 'acct_123example123'
    })
    .persist()
}

const mockStripeRetrieveAccount = (isChargesEnabled, currentDeadlineUnixDate) => {
  nock(`https://${STRIPE_HOST}:${STRIPE_PORT}`)
    .get(`/v1/accounts/acct_123example123`)
    .reply(200, {
      'charges_enabled': isChargesEnabled,
      'requirements': {
        'current_deadline': currentDeadlineUnixDate
      }
    })
    .persist()
}

const getDashboard = (testApp = app) => {
  return supertest(testApp)
    .get(paths.dashboard.index)
}

const mockLedgerGetTransactionsSummary = () => {
  nock(LEDGER_URL)
    .get('/v1/report/transactions-summary')
    .query(obj => {
      return obj.from_date === moment().tz('Europe/London').startOf('day').format()
    })
    .reply(200)
}

describe('dashboard-activity-controller', () => {
  describe('When the dashboard is successfully retrieved from connector', () => {
    describe('and the period is not set', () => {
      let result, $, app

      before('Arrange', () => {
        const session = getMockSession(getUser({
          gateway_account_ids: [GATEWAY_ACCOUNT_ID],
          permissions: [{ name: 'transactions:read' }]
        }))

        mockConnectorGetGatewayAccount()
        mockConnectorGetStripeAccount()
        mockStripeRetrieveAccount(true, null)

        nock(LEDGER_URL)
          .get('/v1/report/transactions-summary')
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
    describe('and the period is set to today explicitly', () => {
      let result, $, app

      before('Arrange', () => {
        const session = getMockSession(getUser({
          gateway_account_ids: [GATEWAY_ACCOUNT_ID],
          permissions: [{ name: 'transactions:read' }]
        }))

        mockConnectorGetGatewayAccount()
        mockConnectorGetStripeAccount()
        mockStripeRetrieveAccount(true, null)

        nock(LEDGER_URL)
          .get('/v1/report/transactions-summary')
          .query(obj => {
            return obj.from_date === moment().tz('Europe/London').startOf('day').subtract(0, 'days').format()
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
          permissions: [{ name: 'transactions:read' }]
        }))

        mockConnectorGetGatewayAccount()
        mockConnectorGetStripeAccount()
        mockStripeRetrieveAccount(true, null)

        nock(LEDGER_URL)
          .get('/v1/report/transactions-summary')
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
          permissions: [{ name: 'transactions:read' }]
        }))

        mockConnectorGetGatewayAccount()
        mockConnectorGetStripeAccount()
        mockStripeRetrieveAccount(true, null)

        nock(LEDGER_URL)
          .get('/v1/report/transactions-summary')
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
          permissions: [{ name: 'transactions:read' }]
        }))

        mockConnectorGetGatewayAccount()
        mockConnectorGetStripeAccount()
        mockStripeRetrieveAccount(true, null)

        nock(LEDGER_URL)
          .get('/v1/report/transactions-summary')
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
    describe('due to a 404 coming from connector', () => {
      let result, $, app

      before('Arrange', () => {
        const session = getMockSession(getUser({
          gateway_account_ids: [GATEWAY_ACCOUNT_ID],
          permissions: [{ name: 'transactions:read' }]
        }))

        mockConnectorGetGatewayAccount()
        mockConnectorGetStripeAccount()
        mockStripeRetrieveAccount(true, null)

        nock(LEDGER_URL)
          .get('/v1/report/transactions-summary')
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
  describe('When the dashboard is retrieved for a service that has requested to go live', () => {
    let session

    before('Arrange', () => {
      session = getMockSession(getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        current_go_live_stage: 'TERMS_AGREED_STRIPE',
        permissions: [{ name: 'transactions:read' }, { name: 'go-live-stage:read' }]
      }))

      mockLedgerGetTransactionsSummary()
      mockConnectorGetGatewayAccount('sandbox', 'test')
      mockConnectorGetStripeAccount()
      mockStripeRetrieveAccount(true, null)

      app = createAppWithSession(getApp(), session)
    })

    it('it should display the live account requested panel', async () => {
      let res = await getDashboard()
      let $ = cheerio.load(res.text)
      expect($('.account-status-panel').length).to.equal(1)
      expect($('.account-status-panel h2').text()).to.equal('GOV.UK Pay are reviewing your request to go live')
    })

    afterEach(() => {
      nock.cleanAll()
    })
  })
  describe('When the dashboard is retrieved for a service that has requested to go live and the user is not an admin', () => {
    let session

    before('Arrange', () => {
      session = getMockSession(getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        current_go_live_stage: 'TERMS_AGREED_STRIPE',
        permissions: [{ name: 'transactions:read' }]
      }))

      mockLedgerGetTransactionsSummary()
      mockConnectorGetGatewayAccount('sandbox', 'test')
      mockConnectorGetStripeAccount()
      mockStripeRetrieveAccount(true, null)

      app = createAppWithSession(getApp(), session)
    })

    it('it should not display the live account requested panel', async () => {
      let res = await getDashboard()
      let $ = cheerio.load(res.text)
      expect($('.account-status-panel').length).to.equal(0)
    })

    afterEach(() => {
      nock.cleanAll()
    })
  })
  describe('When the dashboard is retrieved for Stripe account', () => {
    let session

    describe('User has permission to update account details', () => {
      before('Arrange', () => {
        session = getMockSession(getUser({
          gateway_account_ids: [GATEWAY_ACCOUNT_ID],
          permissions: [{ name: 'transactions:read' }, { name: 'stripe-account-details:update' }]
        }))

        mockLedgerGetTransactionsSummary()

        app = createAppWithSession(getApp(), session)
      })

      beforeEach('Arrange', () => {
        mockConnectorGetGatewayAccount('stripe', 'test')
        mockConnectorGetStripeAccount()
      })

      afterEach(() => {
        nock.cleanAll()
      })

      it('it should display account status panel when account is not fully setup', async () => {
        mockConnectorGetStripeSetup(false, false, true, true)
        mockStripeRetrieveAccount(true, null)
        let res = await getDashboard(createAppWithSession(getApp(), session))
        let $ = cheerio.load(res.text)
        let resultText = $('.account-status-panel').text()
        expect($('.account-status-panel').length).to.equal(1)
        expect(resultText).to.contain('details about your responsible person')
        expect(resultText).to.contain('bank details')
        expect(resultText).to.not.contain('your organisation’s VAT number')
        expect(resultText).to.not.contain('your company registration number if you’ve registered your company')
      })

      it('it should not display account status panel when account is fully setup', async () => {
        mockConnectorGetStripeSetup(true, true, true, true)
        mockStripeRetrieveAccount(true, null)
        let res = await getDashboard()
        let $ = cheerio.load(res.text)
        expect($('.account-status-panel').length).to.equal(0)
      })

      it('it should display account status panel with DATE when account is not fully setup and there is a deadline', async () => {
        mockConnectorGetStripeSetup(true, true, false, false)
        mockStripeRetrieveAccount(true, 1606820691)
        let res = await getDashboard()
        let $ = cheerio.load(res.text)
        expect($('.account-status-panel').length).to.equal(1)
        const resultText = $('.account-status-panel').text()
        expect(resultText).to.contain('You must add more details by 1 December 2020 to continue taking payments')
      })

      it('it should display RESTRICTED account status panel when payouts=false, account is not fully setup', async () => {
        mockConnectorGetStripeSetup(true, true, false, false)
        mockStripeRetrieveAccount(false, null)

        let res = await getDashboard()
        let $ = cheerio.load(res.text)
        expect($('.account-status-panel').length).to.equal(1)
        const resultText = $('.account-status-panel').text()
        expect(resultText).to.contain('Stripe have restricted your account')
      })

      it('it should display RESTRICTED account status panel when payouts=false, account is fully setup', async () => {
        mockConnectorGetStripeSetup(true, true, true, true)
        mockStripeRetrieveAccount(false, null)

        let res = await getDashboard()
        let $ = cheerio.load(res.text)
        expect($('.account-status-panel').length).to.equal(1)
        const resultText = $('.account-status-panel').text()
        expect(resultText).to.contain('Stripe have restricted your account')
        expect(resultText).to.contain('To start taking payments again, please contact support.')
      })
    })
    describe('User does not have permission to update account details', () => {
      before('Arrange', () => {
        session = getMockSession(getUser({
          gateway_account_ids: [GATEWAY_ACCOUNT_ID],
          permissions: [{ name: 'transactions:read' }]
        }))

        mockLedgerGetTransactionsSummary()
        mockConnectorGetStripeAccount()
        mockStripeRetrieveAccount(true, null)

        app = createAppWithSession(getApp(), session)
      })

      beforeEach('Arrange', () => {
        mockConnectorGetGatewayAccount('stripe', 'test')
      })

      afterEach(() => {
        nock.cleanAll()
      })

      it('it should not display account status panel when account is not fully setup', async () => {
        mockConnectorGetStripeSetup(false, false, false, false)
        let res = await getDashboard()
        let $ = cheerio.load(res.text)
        expect($('.account-status-panel').length).to.equal(0)
      })
    })
  })
  describe('When the dashboard is retrieved for non Stripe account', () => {
    let session

    before('Arrange', () => {
      session = getMockSession(getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{ name: 'transactions:read' }]
      }))

      mockLedgerGetTransactionsSummary()
      mockConnectorGetGatewayAccount('sandbox', 'live')
      mockConnectorGetStripeSetup(true, true, true)
      app = createAppWithSession(getApp(), session)
    })

    after(() => {
      nock.cleanAll()
    })

    it('it should not display account status panel', async () => {
      let res = await getDashboard()
      let $ = cheerio.load(res.text)
      expect($('.account-status-panel').length).to.equal(0)
    })
  })
})
