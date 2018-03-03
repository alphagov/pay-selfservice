var path = require('path')
require(path.join(__dirname, '/../test_helpers/serialize_mock.js'))
var userCreator = require(path.join(__dirname, '/../test_helpers/user_creator.js'))
var request = require('supertest')
var nock = require('nock')
var getApp = require(path.join(__dirname, '/../../server.js')).getApp
var paths = require(path.join(__dirname, '/../../app/paths.js'))
var session = require(path.join(__dirname, '/../test_helpers/mock_session.js'))
var assert = require('assert')
var querystring = require('querystring')
const getQueryStringForParams = require('../../app/utils/get_query_string_for_params')
var app

var gatewayAccountId = '452345'

var CONNECTOR_CHARGES_SEARCH_API_PATH = '/v1/api/accounts/' + gatewayAccountId + '/transactions'
var CONNECTOR_ALL_CARD_TYPES_API_PATH = '/v1/api/card-types'

var connectorMock = nock(process.env.CONNECTOR_URL)

var ALL_CARD_TYPES = {
  'card_types': [
    {'id': '1', 'brand': 'mastercard', 'label': 'Mastercard', 'type': 'CREDIT'},
    {'id': '2', 'brand': 'mastercard', 'label': 'Mastercard', 'type': 'DEBIT'},
    {'id': '3', 'brand': 'discover', 'label': 'Discover', 'type': 'CREDIT'},
    {'id': '4', 'brand': 'maestro', 'label': 'Maestro', 'type': 'DEBIT'}]
}

function connectorMockResponds (data, searchParameters) {
  var queryStr = '?' + getQueryStringForParams(searchParameters)

  return connectorMock.get(CONNECTOR_CHARGES_SEARCH_API_PATH + queryStr)
    .reply(200, data)
}

function searchTransactions (data) {
  var query = querystring.stringify(data)

  return request(app)
    .get(paths.transactions.index + '?' + query)
    .set('Accept', 'application/json')
    .send()
}

describe('Pagination', function () {
  afterEach(function () {
    nock.cleanAll()
    app = null
  })

  beforeEach(function (done) {
    let permissions = 'transactions:read'
    var user = session.getUser({
      gateway_account_ids: [gatewayAccountId], permissions: [{name: permissions}]
    })
    app = session.getAppWithLoggedInUser(getApp(), user)

    userCreator.mockUserResponse(user.toJson(), done)

    connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
      .reply(200, ALL_CARD_TYPES)
  })

  describe('Pagination', function () {
    it('should generate correct pagination data when no page number passed', function (done) {
      var connectorData = {}
      var data = {'display_size': 5}
      connectorData.total = 30
      connectorData.results = []
      connectorData._links = {self: {'href': '/v1/api/accounts/111/charges?&page=&display_size=5&state='}}

      connectorMockResponds(connectorData, data)

      searchTransactions(data)
        .expect(200)
        .expect(function (res) {
          res.body.paginationLinks.should.eql([
            {pageNumber: 1, pageName: 1, activePage: true, hasSymbolicName: false},
            {pageNumber: 2, pageName: 2, activePage: false, hasSymbolicName: false},
            {pageNumber: 3, pageName: 3, activePage: false, hasSymbolicName: false},
            {pageNumber: 2, pageName: 'next', activePage: false, hasSymbolicName: true},
            {pageNumber: 6, pageName: 'last', activePage: false, hasSymbolicName: true}
          ])
        })
        .end(done)
    })

    it('should generate correct pagination data when page number passed', function (done) {
      var connectorData = {}
      var data = {'display_size': 5}
      connectorData.total = 30
      connectorData.results = []
      connectorData.page = 3
      connectorData._links = {self: {'href': '/v1/api/accounts/111/charges?&page=3&display_size=5&state='}}

      connectorMockResponds(connectorData, data)

      searchTransactions(data)
        .expect(200)
        .expect(function (res) {
          res.body.paginationLinks.should.eql([
            {pageNumber: 2, pageName: 'previous', activePage: false, hasSymbolicName: true},
            {pageNumber: 1, pageName: 1, activePage: false, hasSymbolicName: false},
            {pageNumber: 2, pageName: 2, activePage: false, hasSymbolicName: false},
            {pageNumber: 3, pageName: 3, activePage: true, hasSymbolicName: false},
            {pageNumber: 4, pageName: 4, activePage: false, hasSymbolicName: false},
            {pageNumber: 5, pageName: 5, activePage: false, hasSymbolicName: false},
            {pageNumber: 4, pageName: 'next', activePage: false, hasSymbolicName: true},
            {pageNumber: 6, pageName: 'last', activePage: false, hasSymbolicName: true}
          ])
        })
        .end(done)
    })

    it('should generate correct pagination data with different display size', function (done) {
      var connectorData = {}
      var data = {'display_size': 5}
      connectorData.total = 30
      connectorData.results = []
      connectorData.page = 3
      connectorData._links = {self: {'href': '/v1/api/accounts/111/charges?&page=3&display_size=2&state='}}

      connectorMockResponds(connectorData, data)

      searchTransactions(data)
        .expect(200)
        .expect(function (res) {
          res.body.paginationLinks.should.eql([
            {pageNumber: 2, pageName: 'previous', activePage: false, hasSymbolicName: true},
            {pageNumber: 1, pageName: 1, activePage: false, hasSymbolicName: false},
            {pageNumber: 2, pageName: 2, activePage: false, hasSymbolicName: false},
            {pageNumber: 3, pageName: 3, activePage: true, hasSymbolicName: false},
            {pageNumber: 4, pageName: 4, activePage: false, hasSymbolicName: false},
            {pageNumber: 5, pageName: 5, activePage: false, hasSymbolicName: false},
            {pageNumber: 4, pageName: 'next', activePage: false, hasSymbolicName: true},
            {pageNumber: 15, pageName: 'last', activePage: false, hasSymbolicName: true}
          ])
        })
        .end(done)
    })

    it('should default to page 1 and display_size 100', function (done) {
      var connectorData = {}
      var data = {'display_size': 5}
      connectorData.total = 600
      connectorData.results = []
      connectorData._links = {self: {'href': '/v1/api/accounts/111/charges?&page=&display_size=&state='}}

      connectorMockResponds(connectorData, data)

      searchTransactions(data)
        .expect(200)
        .expect(function (res) {
          res.body.paginationLinks.should.eql([
            {pageNumber: 1, pageName: 1, activePage: true, hasSymbolicName: false},
            {pageNumber: 2, pageName: 2, activePage: false, hasSymbolicName: false},
            {pageNumber: 3, pageName: 3, activePage: false, hasSymbolicName: false},
            {pageNumber: 2, pageName: 'next', activePage: false, hasSymbolicName: true},
            {pageNumber: 6, pageName: 'last', activePage: false, hasSymbolicName: true}
          ])
        })
        .end(done)
    })

    it('should return correct display size options when total over 500', function (done) {
      var connectorData = {}
      var data = {'display_size': 100}
      connectorData.total = 600
      connectorData.results = []
      connectorData._links = {self: {'href': '/v1/api/accounts/111/charges?&page=1&display_size=100&state='}}

      connectorMockResponds(connectorData, data)

      searchTransactions(data)
        .expect(200)
        .expect(function (res) {
          res.body.pageSizeLinks.should.eql([
            {type: 'small', name: 100, value: 100, active: true},
            {type: 'large', name: 500, value: 500, active: false}
          ])
        })
        .end(done)
    })

    it('should return correct display size options when total between 100 and 500', function (done) {
      var connectorData = {}
      var data = {'display_size': 100}
      connectorData.total = 400
      connectorData.results = []
      connectorData.page = 1
      connectorData._links = {self: {'href': '/v1/api/accounts/111/charges?&page=1&display_size=100&state='}}

      connectorMockResponds(connectorData, data)

      searchTransactions(data)
        .expect(200)
        .expect(function (res) {
          res.body.pageSizeLinks.should.eql([
            {type: 'small', name: 100, value: 100, active: true},
            {type: 'large', name: 'Show all', value: 500, active: false}
          ])
        })
        .end(done)
    })

    it('should return correct display size options when total under 100', function (done) {
      var connectorData = {}
      var data = {'display_size': 100}
      connectorData.total = 50
      connectorData.results = []
      connectorData._links = {self: {'href': '/v1/api/accounts/111/charges?&page=1&display_size=100&state='}}

      connectorMockResponds(connectorData, data)

      searchTransactions(data)
        .expect(200)
        .expect(function (res) {
          assert.equal(res.body.hasPageSizeLinks, false)
        })
        .end(done)
    })

    it('should return correct display size options when total under 100', function (done) {
      var connectorData = {}
      var data = {'display_size': 500}
      connectorData.total = 150
      connectorData.results = []
      connectorData._links = {self: {'href': '/v1/api/accounts/111/charges?&page=1&display_size=500&state='}}

      connectorMockResponds(connectorData, data)

      searchTransactions(data)
        .expect(200)
        .expect(function (res) {
          assert.equal(res.body.hasPageSizeLinks, true)
        })
        .end(done)
    })

    it('should return return error if page out of bounds', function (done) {
      var data = {'page': -1}

      searchTransactions(data)
        .expect(500, {'message': 'Invalid search'}).end(done)
    })

    it('should return return error if pageSize out of bounds 1', function (done) {
      var data = {'pageSize': 600}

      searchTransactions(data)
        .expect(500, {'message': 'Invalid search'}).end(done)
    })

    it('should return return error if pageSize out of bounds 2', function (done) {
      var data = {'pageSize': 0}

      searchTransactions(data)
        .expect(500, {'message': 'Invalid search'}).end(done)
    })
  })
})
