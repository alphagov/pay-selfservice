'use strict'

const path = require('path')
process.env.SESSION_ENCRYPTION_KEY = 'naskjwefvwei72rjkwfmjwfi72rfkjwefmjwefiuwefjkbwfiu24fmjbwfk'
require(path.join(__dirname, '/../test_helpers/serialize_mock.js'))
const userCreator = require(path.join(__dirname, '/../test_helpers/user_creator.js'))
const request = require('supertest')
const nock = require('nock')
const _ = require('lodash')
const getApp = require(path.join(__dirname, '/../../server.js')).getApp
const querystring = require('querystring')
const paths = require(path.join(__dirname, '/../../app/paths.js'))
const session = require(path.join(__dirname, '/../test_helpers/mock_session.js'))
const assert = require('chai').assert
const expect = require('chai').expect
const getQueryStringForParams = require('../../app/utils/get_query_string_for_params')

const userFixture = require('../../test/fixtures/user_fixtures')
const gatewayAccountId = '651342'
let app

const CHARGES_API_PATH = '/v2/api/accounts/' + gatewayAccountId + '/charges'
const connectorMock = nock(process.env.CONNECTOR_URL)
const adminusersMock = nock(process.env.ADMINUSERS_URL)

function connectorMockResponds (code, data, searchParameters) {
  searchParameters.pageSize = searchParameters.pageSize || 500
  let queryStr = '?' + getQueryStringForParams(searchParameters)

  return connectorMock.get(CHARGES_API_PATH + queryStr)
    .reply(code, data)
}

function downloadTransactionList (query) {
  return request(app)
    .get(paths.transactions.download + '?' + querystring.stringify(query))
    .set('Accept', 'application/json')
}

describe('Transaction download endpoints', function () {
  afterEach(function () {
    nock.cleanAll()
    app = null
  })

  beforeEach(function (done) {
    let permissions = 'transactions-download:read'
    let user = session.getUser({
      gateway_account_ids: [gatewayAccountId],
      permissions: [{name: permissions}]
    })
    app = session.getAppWithLoggedInUser(getApp(), user)

    userCreator.mockUserResponse(user.toJson(), done)
  })

  describe('The /transactions/download endpoint', function () {
    it('should download a csv file comprising a list of transactions for the gateway account', function (done) {
      let results = require('./json/transaction_download.json')

      let mockJson = {
        results: results,
        _links: {
          next_page: {href: 'http://localhost:8000/bar'}
        }
      }
      adminusersMock.get('/v1/api/users').reply(200, [])

      let secondPageMock = nock('http://localhost:8000')
      let secondResults = _.cloneDeep(results)
      secondResults[0].amount = 1234
      secondResults[1].amount = 123

      secondPageMock.get('/bar')
        .reply(200, {
          results: secondResults
        })

      connectorMockResponds(200, mockJson, {})

      downloadTransactionList()
        .expect(200)
        .expect('Content-Type', 'text/csv; charset=utf-8')
        .expect('Content-disposition', /attachment; filename="GOVUK_Pay_\d\d\d\d-\d\d-\d\d_\d\d:\d\d:\d\d.csv"/)
        .expect(function (res) {
          let csvContent = res.text
          let arrayOfLines = csvContent.split('\n')
          assert(5, arrayOfLines.length)
          assert.equal('"red","desc-red","alice.111@mail.fake","123.45","Visa","TEST01","12/19","4242","Success",true,"","","transaction-1","charge1","","12 May 2016","17:37:29"', arrayOfLines[1])
          assert.equal('"blue","desc-blue","alice.222@mail.fake","9.99","Mastercard","TEST02","12/19","4241","Cancelled",true,"P01234","Something happened","transaction-2","charge2","","12 Apr 2015","19:55:29"', arrayOfLines[2])
        })
        .end(function (err, res) {
          if (err) return done(err)
          let csvContent = res.text
          let arrayOfLines = csvContent.split('\n')
          expect(arrayOfLines.length).to.equal(5)
          expect(arrayOfLines[0]).to.equal('"Reference","Description","Email","Amount","Card Brand","Cardholder Name","Card Expiry Date","Card Number","State","Finished","Error Code","Error Message","Provider ID","GOV.UK Payment ID","Issued By","Date Created","Time Created"')
          expect(arrayOfLines[1]).to.equal('"red","desc-red","alice.111@mail.fake","123.45","Visa","TEST01","12/19","4242","Success",true,"","","transaction-1","charge1","","12 May 2016","17:37:29"')
          expect(arrayOfLines[2]).to.equal('"blue","desc-blue","alice.222@mail.fake","9.99","Mastercard","TEST02","12/19","4241","Cancelled",true,"P01234","Something happened","transaction-2","charge2","","12 Apr 2015","19:55:29"')
          expect(arrayOfLines[3]).to.equal('"red","desc-red","alice.111@mail.fake","12.34","Visa","TEST01","12/19","4242","Success",true,"","","transaction-1","charge1","","12 May 2016","17:37:29"')
          expect(arrayOfLines[4]).to.equal('"blue","desc-blue","alice.222@mail.fake","1.23","Mastercard","TEST02","12/19","4241","Cancelled",true,"P01234","Something happened","transaction-2","charge2","","12 Apr 2015","19:55:29"')
          done()
        })
    })

    // @see https://payments-platform.atlassian.net/browse/PP-2254
    it('should download a csv file comprising a list of transactions and preventing Spreadsheet Formula Injection', function (done) {
      let results = require('./json/transaction_download_spreadsheet_formula_injection.json')

      let mockJson = {
        results: results,
        _links: {
          next_page: {href: 'http://localhost:8000/bar'}
        }
      }

      let secondPageMock = nock('http://localhost:8000')

      secondPageMock.get('/bar')
        .reply(200, {
          results: results
        })
      adminusersMock.get('/v1/api/users').reply(200, [])

      connectorMockResponds(200, mockJson, {})

      downloadTransactionList()
        .expect(200)
        .expect('Content-Type', 'text/csv; charset=utf-8')
        .expect('Content-disposition', /attachment; filename="GOVUK_Pay_\d\d\d\d-\d\d-\d\d_\d\d:\d\d:\d\d.csv"/)
        .end(function (err, res) {
          if (err) return done(err)
          let csvContent = res.text
          let arrayOfLines = csvContent.split('\n')
          expect(arrayOfLines[0]).to.equal('"Reference","Description","Email","Amount","Card Brand","Cardholder Name","Card Expiry Date","Card Number","State","Finished","Error Code","Error Message","Provider ID","GOV.UK Payment ID","Issued By","Date Created","Time Created"')
          expect(arrayOfLines[1]).to.equal('"\'+red","\'=calc+z!A0","\'-alice.111@mail.fake","123.45","\'@Visa","TEST01","12/19","4242","Success",false,"","","transaction-1","charge1","","12 May 2016","17:37:29"')
          done()
        })
    })

    it('should download a csv file with expected refund states filtering', function (done) {
      let results = require('./json/transaction_download_refunds.json')

      let mockJson = {
        results: results,
        _links: {
          next_page: {href: 'http://localhost:8000/bar'}
        }
      }
      let secondPageMock = nock('http://localhost:8000')

      secondPageMock.get('/bar')
        .reply(200, {
          results: results
        })
      let user = userFixture.validUser({
        username: 'thisisausername'
      }).getPlain()

      connectorMockResponds(200, mockJson, {refund_states: 'success'})
      adminusersMock.get('/v1/api/users?ids=thisisauser').reply(200, [user])
      request(app)
        .get(paths.transactions.download + '?refund_states=success')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', 'text/csv; charset=utf-8')
        .expect('Content-disposition', /attachment; filename="GOVUK_Pay_\d\d\d\d-\d\d-\d\d_\d\d:\d\d:\d\d.csv"/)
        .end(function (err, res) {
          if (err) return done(err)
          let csvContent = res.text
          let arrayOfLines = csvContent.split('\n')
          expect(arrayOfLines[0]).to.equal('"Reference","Description","Email","Amount","Card Brand","Cardholder Name","Card Expiry Date","Card Number","State","Finished","Error Code","Error Message","Provider ID","GOV.UK Payment ID","Issued By","Date Created","Time Created"')
          expect(arrayOfLines[1]).to.equal('"\'+red","\'=calc+z!A0","\'-alice.111@mail.fake","-123.45","\'@Visa","TEST01","12/19","4242","Refund success",false,"","","transaction-1","charge1","thisisausername","12 May 2016","17:37:29"')
          done()
        })
    })

    it('should download a csv file with expected payment states filtering', function (done) {
      let results = require('./json/transaction_download_spreadsheet_formula_injection.json')

      let mockJson = {
        results: results,
        _links: {
          next_page: {href: 'http://localhost:8000/bar'}
        }
      }

      let secondPageMock = nock('http://localhost:8000')

      secondPageMock.get('/bar')
        .reply(200, {
          results: results
        })
      connectorMockResponds(200, mockJson, {payment_states: 'success'})
      adminusersMock.get('/v1/api/users').reply(200, [])

      request(app)
        .get(paths.transactions.download + '?payment_states=success')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', 'text/csv; charset=utf-8')
        .expect('Content-disposition', /attachment; filename="GOVUK_Pay_\d\d\d\d-\d\d-\d\d_\d\d:\d\d:\d\d.csv"/)
        .end(function (err, res) {
          if (err) return done(err)
          let csvContent = res.text
          let arrayOfLines = csvContent.split('\n')
          expect(arrayOfLines[0]).to.equal('"Reference","Description","Email","Amount","Card Brand","Cardholder Name","Card Expiry Date","Card Number","State","Finished","Error Code","Error Message","Provider ID","GOV.UK Payment ID","Issued By","Date Created","Time Created"')
          expect(arrayOfLines[1]).to.equal('"\'+red","\'=calc+z!A0","\'-alice.111@mail.fake","123.45","\'@Visa","TEST01","12/19","4242","Success",false,"","","transaction-1","charge1","","12 May 2016","17:37:29"')
          done()
        })
    })

    it('should show error message on a bad request', function (done) {
      let errorMessage = 'Unable to download list of transactions.'
      connectorMockResponds(400, {'message': errorMessage}, {})

      downloadTransactionList()
        .expect(500, {'message': 'Internal server error'})
        .end(done)
    })

    it('should show a generic error message on a connector service error.', function (done) {
      connectorMockResponds(500, {'message': 'some error from connector'}, {})

      downloadTransactionList()
        .expect(500, {'message': 'Internal server error'})
        .end(done)
    })

    it('should show internal error message if any error happens while retrieving the list from connector', function (done) {
      // No connectorMock defined on purpose to mock a network failure

      downloadTransactionList()
        .expect(500, {'message': 'Internal server error'})
        .end(done)
    })
  })
})
