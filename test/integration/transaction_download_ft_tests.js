'use strict'

// NPM Dependencies
const request = require('supertest')
const nock = require('nock')
const _ = require('lodash')
const querystring = require('querystring')
const assert = require('chai').assert
const expect = require('chai').expect

// Local dependencies
require('../test_helpers/serialize_mock')
const userCreator = require('../test_helpers/user_creator')
const getApp = require('../../server').getApp
const paths = require('../../app/paths')
const session = require('../test_helpers/mock_session')
const getQueryStringForParams = require('../../app/utils/get_query_string_for_params')
const userFixture = require('../../test/fixtures/user_fixtures')

// Constants and Setup
process.env.SESSION_ENCRYPTION_KEY = 'naskjwefvwei72rjkwfmjwfi72rfkjwefmjwefiuwefjkbwfiu24fmjbwfk'
const gatewayAccountId = '651342'
let app

const LEDGER_TRANSACTION_PATH = '/v1/transaction?with_parent_transaction=true&account_id=' + gatewayAccountId
const CONNECTOR_ACCOUNT_PATH = '/v1/frontend/accounts/' + gatewayAccountId
const connectorMock = nock(process.env.CONNECTOR_URL)
const adminusersMock = nock(process.env.ADMINUSERS_URL)
const ledgerMock = nock(process.env.LEDGER_URL)

const CSV_COLUMN_NAMES = '"Reference","Description","Email","Amount","Card Brand","Cardholder Name","Card Expiry Date","Card Number","State","Finished","Error Code","Error Message","Provider ID","GOV.UK Payment ID","Issued By","Date Created","Time Created","Corporate Card Surcharge","Total Amount","Wallet Type"'
const CSV_COLUMN_NAMES_WITH_CARD_TYPE = CSV_COLUMN_NAMES + ',"Card Type"'

function ledgerMockResponds (code, data, searchParameters) {
  searchParameters.pageSize = searchParameters.pageSize || 500
  const queryStr = '&' + getQueryStringForParams(searchParameters, true, true)
  return ledgerMock.get(LEDGER_TRANSACTION_PATH + queryStr)
    .reply(code, data)
}

function downloadTransactionList (query) {
  return request(app)
    .get(paths.transactions.download + '?' + querystring.stringify(query))
    .set('Accept', 'application/json')
}

function downloadTransactionListCSV (query) {
  return request(app)
    .get(paths.transactions.download + '?' + querystring.stringify(query))
    .set('Accept', 'text/csv')
}

describe('Transaction download endpoints', function () {
  afterEach(() => {
    nock.cleanAll()
    app = null
  })

  beforeEach(done => {
    const permissions = 'transactions-download:read'
    const user = session.getUser({
      gateway_account_ids: [gatewayAccountId],
      permissions: [{ name: permissions }]
    })
    app = session.getAppWithLoggedInUser(getApp(), user)

    userCreator.mockUserResponse(user.toJson(), done)
  })

  describe('The /transactions/download endpoint with USE_LEDGER_BACKEND_CSV false', () => {
    beforeEach(() => {
      connectorMock.get(CONNECTOR_ACCOUNT_PATH)
        .reply(200, {
          'payment_provider': 'sandbox',
          'gateway_account_id': gatewayAccountId,
          'credentials': { 'username': 'a-username' },
          'allow_moto': true
        })
    })

    it('should download a csv file comprising a list of transactions for the gateway account', done => {
      const results = require('./json/transaction_download.json')

      const mockJson = {
        results: results,
        _links: {
          next_page: { href: 'http://localhost:8006/bar' }
        }
      }
      adminusersMock.get('/v1/api/users').reply(200, [])

      const secondPageMock = nock('http://localhost:8006')
      const secondResults = _.cloneDeep(results)
      secondResults[0].amount = 12000
      secondResults[0].corporate_card_surcharge = 250
      secondResults[0].total_amount = 12250
      secondResults[1].amount = 123
      secondResults[1].total_amount = 123
      secondResults[1].wallet_type = 'GOOGLE_PAY'

      secondPageMock.get('/bar')
        .reply(200, {
          results: secondResults
        })

      ledgerMockResponds(200, mockJson, {})

      downloadTransactionList()
        .expect(200)
        .expect('Content-Type', 'text/csv; charset=utf-8')
        .expect('Content-disposition', /attachment; filename="GOVUK_Pay_\d\d\d\d-\d\d-\d\d_\d\d:\d\d:\d\d.csv"/)
        .expect(function (res) {
          const csvContent = res.text
          const arrayOfLines = csvContent.split('\n')
          assert(5, arrayOfLines.length)
          assert.strictEqual('"red","desc-red","alice.111@mail.fake","123.45","Visa","TEST01","12/19","4242","Success",true,"","","transaction-1","charge1","","12 May 2016","17:37:29","0.00","123.45","","some string",true,123,"credit"', arrayOfLines[1])
          assert.strictEqual('"blue","desc-blue","alice.222@mail.fake","9.99","Mastercard","TEST02","12/19","4241","Cancelled",true,"P01234","Something happened","transaction-2","charge2","","12 Apr 2015","19:55:29","0.00","9.99","","","","",""', arrayOfLines[2])
        })
        .end(function (err, res) {
          if (err) return done(err)
          const csvContent = res.text
          const arrayOfLines = csvContent.split('\n')
          expect(arrayOfLines.length).to.equal(5)
          expect(arrayOfLines[0]).to.equal(CSV_COLUMN_NAMES + ',"key1 (metadata)","key2 (metadata)","key3 (metadata)","Card Type"')
          expect(arrayOfLines[1]).to.equal('"red","desc-red","alice.111@mail.fake","123.45","Visa","TEST01","12/19","4242","Success",true,"","","transaction-1","charge1","","12 May 2016","17:37:29","0.00","123.45","","some string",true,123,"credit"')
          expect(arrayOfLines[2]).to.equal('"blue","desc-blue","alice.222@mail.fake","9.99","Mastercard","TEST02","12/19","4241","Cancelled",true,"P01234","Something happened","transaction-2","charge2","","12 Apr 2015","19:55:29","0.00","9.99","","","","",""')
          expect(arrayOfLines[3]).to.equal('"red","desc-red","alice.111@mail.fake","120.00","Visa","TEST01","12/19","4242","Success",true,"","","transaction-1","charge1","","12 May 2016","17:37:29","2.50","122.50","","some string",true,123,"credit"')
          expect(arrayOfLines[4]).to.equal('"blue","desc-blue","alice.222@mail.fake","1.23","Mastercard","TEST02","12/19","4241","Cancelled",true,"P01234","Something happened","transaction-2","charge2","","12 Apr 2015","19:55:29","0.00","1.23","Google Pay","","","",""')
          done()
        })
    })

    // @see https://payments-platform.atlassian.net/browse/PP-2254
    it('should download a csv file comprising a list of transactions and preventing Spreadsheet Formula Injection', done => {
      const results = require('./json/transaction_download_spreadsheet_formula_injection.json')

      const mockJson = {
        results: results,
        _links: {
          next_page: { href: 'http://localhost:8006/bar' }
        }
      }

      const secondPageMock = nock('http://localhost:8006')

      secondPageMock.get('/bar')
        .reply(200, {
          results: results
        })
      adminusersMock.get('/v1/api/users').reply(200, [])

      ledgerMockResponds(200, mockJson, {})

      downloadTransactionList()
        .expect(200)
        .expect('Content-Type', 'text/csv; charset=utf-8')
        .expect('Content-disposition', /attachment; filename="GOVUK_Pay_\d\d\d\d-\d\d-\d\d_\d\d:\d\d:\d\d.csv"/)
        .end(function (err, res) {
          if (err) return done(err)
          const csvContent = res.text
          const arrayOfLines = csvContent.split('\n')
          expect(arrayOfLines[0]).to.equal(CSV_COLUMN_NAMES_WITH_CARD_TYPE)
          expect(arrayOfLines[1]).to.equal('"\'+red","\'=calc+z!A0","\'-alice.111@mail.fake","123.45","\'@Visa","TEST01","12/19","4242","Success",false,"","","transaction-1","charge1","","12 May 2016","17:37:29","0.00","123.45","","credit"')
          done()
        })
    })

    it('should download a csv file with expected refund states filtering', done => {
      const results = require('./json/transaction_download_refunds.json')

      const mockJson = {
        results: results,
        _links: {
          next_page: { href: 'http://localhost:8006/bar' }
        }
      }
      const secondPageMock = nock('http://localhost:8006')

      secondPageMock.get('/bar')
        .reply(200, {
          results: results
        })
      const user = userFixture.validUserResponse({
        external_id: '1stUserId',
        username: 'first_user_name'
      }).getPlain()

      const user2 = userFixture.validUserResponse({
        external_id: '2ndUserId',
        username: 'second_user_name'
      }).getPlain()

      ledgerMockResponds(200, mockJson, { refund_states: 'success' })
      adminusersMock.get('/v1/api/users')
        .query({ ids: '1stUserId,2ndUserId' })
        .reply(200, [user2, user])
      request(app)
        .get(paths.transactions.download + '?refund_states=success')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', 'text/csv; charset=utf-8')
        .expect('Content-disposition', /attachment; filename="GOVUK_Pay_\d\d\d\d-\d\d-\d\d_\d\d:\d\d:\d\d.csv"/)
        .end(function (err, res) {
          if (err) return done(err)
          const csvContent = res.text
          const arrayOfLines = csvContent.split('\n')
          expect(arrayOfLines[0]).to.equal(CSV_COLUMN_NAMES_WITH_CARD_TYPE)
          expect(arrayOfLines[1]).to.equal('"\'+red","\'=calc+z!A0","\'-alice.111@mail.fake","-123.45","\'@Visa","TEST01","12/19","4242","Refund success",false,"","","transaction-1","charge1","first_user_name","12 May 2016","17:37:29","0.00","-123.45","","credit"')
          expect(arrayOfLines[2]).to.equal('"\'+red","\'=calc+z!A0","\'-alice.111@mail.fake","-123.45","\'@Visa","TEST01","12/19","4242","Refund success",false,"","","transaction-1","charge2","","12 May 2016","17:37:29","0.00","-123.45","","credit"')
          expect(arrayOfLines[3]).to.equal('"\'+red","\'=calc+z!A0","\'-alice.111@mail.fake","-123.45","\'@Visa","TEST01","12/19","4242","Refund success",false,"","","transaction-1","charge3","second_user_name","12 May 2016","17:37:29","0.00","-123.45","","credit"')
          done()
        })
    })

    it('should download a csv file with expected payment states filtering', done => {
      const results = require('./json/transaction_download_spreadsheet_formula_injection.json')

      const mockJson = {
        results: results,
        _links: {
          next_page: { href: 'http://localhost:8006/bar' }
        }
      }

      const secondPageMock = nock('http://localhost:8006')

      secondPageMock.get('/bar')
        .reply(200, {
          results: results
        })
      ledgerMockResponds(200, mockJson, { payment_states: 'success' })
      adminusersMock.get('/v1/api/users').reply(200, [])

      request(app)
        .get(paths.transactions.download + '?payment_states=success')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', 'text/csv; charset=utf-8')
        .expect('Content-disposition', /attachment; filename="GOVUK_Pay_\d\d\d\d-\d\d-\d\d_\d\d:\d\d:\d\d.csv"/)
        .end(function (err, res) {
          if (err) return done(err)
          const csvContent = res.text
          const arrayOfLines = csvContent.split('\n')
          expect(arrayOfLines[0]).to.equal(CSV_COLUMN_NAMES_WITH_CARD_TYPE)
          expect(arrayOfLines[1]).to.equal('"\'+red","\'=calc+z!A0","\'-alice.111@mail.fake","123.45","\'@Visa","TEST01","12/19","4242","Success",false,"","","transaction-1","charge1","","12 May 2016","17:37:29","0.00","123.45","","credit"')
          done()
        })
    })

    it('should download a csv file when the next_page is relative URI (not full connector URL) ', done => {
      const results = require('./json/transaction_download_spreadsheet_formula_injection.json')

      const mockJson = {
        results: results,
        _links: {
          next_page: { href: 'bar' }
        }
      }

      const secondPageMock = nock('http://localhost:8006')

      secondPageMock.get('/bar')
        .reply(200, {
          results: results
        })
      ledgerMockResponds(200, mockJson, { payment_states: 'success' })
      adminusersMock.get('/v1/api/users').reply(200, [])

      request(app)
        .get(paths.transactions.download + '?payment_states=success')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', 'text/csv; charset=utf-8')
        .expect('Content-disposition', /attachment; filename="GOVUK_Pay_\d\d\d\d-\d\d-\d\d_\d\d:\d\d:\d\d.csv"/)
        .end(function (err, res) {
          if (err) return done(err)
          const csvContent = res.text
          const arrayOfLines = csvContent.split('\n')
          expect(arrayOfLines[0]).to.equal(CSV_COLUMN_NAMES_WITH_CARD_TYPE)
          expect(arrayOfLines[1]).to.equal('"\'+red","\'=calc+z!A0","\'-alice.111@mail.fake","123.45","\'@Visa","TEST01","12/19","4242","Success",false,"","","transaction-1","charge1","","12 May 2016","17:37:29","0.00","123.45","","credit"')
          done()
        })
    })

    it('should show error message on a bad request', done => {
      const errorMessage = 'Unable to download list of transactions.'
      ledgerMockResponds(400, { 'message': errorMessage }, {})

      downloadTransactionList()
        .expect(500, { 'message': 'Internal server error' })
        .end(done)
    })

    it('should show a generic error message on a connector service error.', done => {
      ledgerMockResponds(500, { 'message': 'some error from connector' }, {})

      downloadTransactionList()
        .expect(500, { 'message': 'Internal server error' })
        .end(done)
    })

    it('should show internal error message if any error happens while retrieving the list from connector', done => {
      // No connectorMock defined on purpose to mock a network failure

      downloadTransactionList()
        .expect(500, { 'message': 'Internal server error' })
        .end(done)
    })
  })

  describe('The /transactions/download endpoint with USE_LEDGER_BACKEND_CSV true', () => {
    const testCsv = '"col1","col2","col3"\n"val1",,"val3"'

    const mockLedgerCsvResponse = function (url) {
      ledgerMock
        .defaultReplyHeaders({
          'Content-Type': 'text/csv'
        })
        .matchHeader('accept', 'text/csv')
        .matchHeader('content-type', 'application/json')
        .get(url)
        .reply(200, testCsv)
    }

    const assertCsvReturned = async function () {
      return downloadTransactionListCSV()
        .expect(200)
        .expect('Content-Type', 'text/csv')
        .expect('Content-disposition', /attachment; filename="GOVUK_Pay_\d\d\d\d-\d\d-\d\d_\d\d:\d\d:\d\d.csv"/)
        .then(function (res) {
          expect(res.text).to.equal(testCsv)
        })
    }

    beforeEach(() => {
      process.env.USE_LEDGER_BACKEND_CSV = true
    })

    it('should return CSV from ledger', async () => {
      connectorMock.get(CONNECTOR_ACCOUNT_PATH)
        .reply(200, {
          'gateway_account_id': gatewayAccountId
        })

      mockLedgerCsvResponse(LEDGER_TRANSACTION_PATH)
      return assertCsvReturned()
    })

    it('should request CSV with moto header', async () => {
      connectorMock.get(CONNECTOR_ACCOUNT_PATH)
        .reply(200, {
          'gateway_account_id': gatewayAccountId,
          'allow_moto': true
        })

      mockLedgerCsvResponse(LEDGER_TRANSACTION_PATH + '&moto_header=true')
      return assertCsvReturned()
    })

    it('should request CSV with fee headers', async () => {
      connectorMock.get(CONNECTOR_ACCOUNT_PATH)
        .reply(200, {
          'gateway_account_id': gatewayAccountId,
          'payment_provider': 'stripe'
        })

      mockLedgerCsvResponse(LEDGER_TRANSACTION_PATH + '&fee_headers=true')
      return assertCsvReturned()
    })
  })
})
