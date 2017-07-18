var path = require('path')
process.env.SESSION_ENCRYPTION_KEY = 'naskjwefvwei72rjkwfmjwfi72rfkjwefmjwefiuwefjkbwfiu24fmjbwfk'
require(path.join(__dirname, '/../test_helpers/serialize_mock.js'))
var userCreator = require(path.join(__dirname, '/../test_helpers/user_creator.js'))
var request = require('supertest')
var nock = require('nock')
var _ = require('lodash')
var getApp = require(path.join(__dirname, '/../../server.js')).getApp
var querystring = require('querystring')
var paths = require(path.join(__dirname, '/../../app/paths.js'))
var session = require(path.join(__dirname, '/../test_helpers/mock_session.js'))
var assert = require('chai').assert
var expect = require('chai').expect

var gatewayAccountId = 651342
var app

var CHARGES_API_PATH = '/v1/api/accounts/' + gatewayAccountId + '/charges'
var connectorMock = nock(process.env.CONNECTOR_URL)

function connectorMockResponds (code, data, searchParameters) {
  var queryStr = '?'
  queryStr += 'reference=' + (searchParameters.reference ? searchParameters.reference : '') +
    '&email=' + (searchParameters.email ? searchParameters.email : '') +
    '&state=' + (searchParameters.state ? searchParameters.state : '') +
    '&card_brand=' + (searchParameters.brand ? searchParameters.brand : '') +
    '&from_date=' + (searchParameters.fromDate ? searchParameters.fromDate : '') +
    '&to_date=' + (searchParameters.toDate ? searchParameters.toDate : '') +
    '&page=' + (searchParameters.page ? searchParameters.page : '1') +
    '&display_size=' + (searchParameters.pageSize ? searchParameters.pageSize : '100')
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
    var user = session.getUser({
      gateway_account_ids: [gatewayAccountId], permissions: [{name: permissions}]
    })
    app = session.getAppWithLoggedInUser(getApp(), user)

    userCreator.mockUserResponse(user.toJson(), done)
  })

  describe('The /transactions/download endpoint', function () {
    it('should download a csv file comprising a list of transactions for the gateway account', function (done) {
      var results = require('./json/transaction_download.json')

      var mockJson = {
        results: results,
        _links: {
          next_page: {href: 'http://localhost:8000/bar'}
        }
      }

      var secondPageMock = nock('http://localhost:8000')
      var secondResults = _.cloneDeep(results)
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
        .expect('Content-disposition', /attachment; filename=GOVUK Pay \d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d.csv/)
        .expect(function (res) {
          var csvContent = res.text
          var arrayOfLines = csvContent.split('\n')
          assert(5, arrayOfLines.length)
          assert.equal('"red","desc-red","alice.111@mail.fake","123.45","Visa","TEST01","12/19","4242","succeeded",false,"","","transaction-1","charge1","12 May 2016 — 17:37:29"', arrayOfLines[1])
          assert.equal('"blue","desc-blue","alice.222@mail.fake","9.99","Mastercard","TEST02","12/19","4241","canceled",true,"P01234","Something happened","transaction-2","charge2","12 Apr 2015 — 19:55:29"', arrayOfLines[2])
        })
        .end(function (err, res) {
          if (err) return done(err)
          var csvContent = res.text
          var arrayOfLines = csvContent.split('\n')
          expect(arrayOfLines.length).to.equal(5)
          expect(arrayOfLines[0]).to.equal('"Reference","Description","Email","Amount","Card Brand","Cardholder Name","Card Expiry Date","Card Number","State","Finished","Error Code","Error Message","Provider ID","GOV.UK Payment ID","Date Created"')
          expect(arrayOfLines[1]).to.equal('"red","desc-red","alice.111@mail.fake","123.45","Visa","TEST01","12/19","4242","succeeded",false,"","","transaction-1","charge1","12 May 2016 — 17:37:29"')
          expect(arrayOfLines[2]).to.equal('"blue","desc-blue","alice.222@mail.fake","9.99","Mastercard","TEST02","12/19","4241","canceled",true,"P01234","Something happened","transaction-2","charge2","12 Apr 2015 — 19:55:29"')
          expect(arrayOfLines[3]).to.equal('"red","desc-red","alice.111@mail.fake","12.34","Visa","TEST01","12/19","4242","succeeded",false,"","","transaction-1","charge1","12 May 2016 — 17:37:29"')
          expect(arrayOfLines[4]).to.equal('"blue","desc-blue","alice.222@mail.fake","1.23","Mastercard","TEST02","12/19","4241","canceled",true,"P01234","Something happened","transaction-2","charge2","12 Apr 2015 — 19:55:29"')
          done()
        })
    })

      // @see https://payments-platform.atlassian.net/browse/PP-2254
    it('should download a csv file comprising a list of transactions and preventing Spreadsheet Formula Injection', function (done) {
      var results = require('./json/transaction_download_spreadsheet_formula_injection.json')

      var mockJson = {
        results: results,
        _links: {
          next_page: {href: 'http://localhost:8000/bar'}
        }
      }

      var secondPageMock = nock('http://localhost:8000')

      secondPageMock.get('/bar')
              .reply(200, {
                results: results
              })

      connectorMockResponds(200, mockJson, {})

      downloadTransactionList()
              .expect(200)
              .expect('Content-Type', 'text/csv; charset=utf-8')
              .expect('Content-disposition', /attachment; filename=GOVUK Pay \d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d.csv/)
              .end(function (err, res) {
                if (err) return done(err)
                var csvContent = res.text
                var arrayOfLines = csvContent.split('\n')
                expect(arrayOfLines[0]).to.equal('"Reference","Description","Email","Amount","Card Brand","Cardholder Name","Card Expiry Date","Card Number","State","Finished","Error Code","Error Message","Provider ID","GOV.UK Payment ID","Date Created"')
                expect(arrayOfLines[1]).to.equal('"\'+red","\'=calc+z!A0","\'-alice.111@mail.fake","123.45","\'@Visa","TEST01","12/19","4242","succeeded",false,"","","transaction-1","charge1","12 May 2016 — 17:37:29"')
                done()
              })
    })

    it('should show error message on a bad request', function (done) {
      var errorMessage = 'Unable to download list of transactions.'
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
