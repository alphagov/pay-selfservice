'use strict'

// NPM Dependencies
const nock = require('nock')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Local Dependencies
const transactionService = require('../../../app/services/transaction_service')
var getQueryStringForParams = require('../../../app/utils/get_query_string_for_params')
const TEST_ACCOUNT_ID = 123
const TRANSACTION_SEARCH_PATH = `/v1/api/accounts/${TEST_ACCOUNT_ID}/transactions`

const {expect} = chai
chai.use(chaiAsPromised)

describe('transaction service', () => {
  afterEach(() => nock.cleanAll())

  describe('search', () => {
    describe('when connector returns correctly', () => {
      before(() => {
        nock.cleanAll()

        nock(process.env.CONNECTOR_URL)
          .get(`${TRANSACTION_SEARCH_PATH}?${getQueryStringForParams()}`)
          .reply(200, {})
      })

      it('should return the correct promise', () => {
        return expect(transactionService.search(TEST_ACCOUNT_ID, {}, 'some-unique-id'))
          .to.eventually.be.fulfilled
      })
    })

    describe('when connector is unavailable', () => {
      it('should return client unavailable', () => {
        return expect(transactionService.search(TEST_ACCOUNT_ID, {}, 'some-unique-id'))
            .to.be.rejectedWith(Error, 'CLIENT_UNAVAILABLE')
      }
      )
    })

    describe('when connector returns incorrect response code while retrieving the list of transactions', () => {
      before(() => {
        nock(process.env.CONNECTOR_URL)
          .get(`${TRANSACTION_SEARCH_PATH}?${getQueryStringForParams()}`)
          .reply(404, '')
      })

      it('should return get_failed', () => {
        return expect(transactionService.search(TEST_ACCOUNT_ID, {}, 'some-unique-id'))
          .to.be.rejectedWith(Error, 'GET_FAILED')
      })
    })
  })

  describe('searchAll', () => {
    describe('when connector returns correctly', () => {
      it('should return into the correct promise when it uses the legacy \'state\' method of querying states', () => {
        nock(process.env.CONNECTOR_URL)
          .get(`${TRANSACTION_SEARCH_PATH}?${getQueryStringForParams({pageSize: 100, page: 1, state: 'success'})}`)
          .reply(200, {})
        return expect(transactionService.searchAll(TEST_ACCOUNT_ID, {pageSize: 100, page: 1, state: 'success'}, 'some-unique-id'))
          .to.eventually.be.fulfilled
      })

      it('should return into the correct promise when it uses the new  \'refund_states\' method of querying refund states and multiple have been selected', () => {
        nock(process.env.CONNECTOR_URL)
          .get(`${TRANSACTION_SEARCH_PATH}?${getQueryStringForParams({pageSize: 100, page: 1, refund_states: ['refund_success', 'refund_error']})}`)
          .reply(200, {})
        return expect(transactionService.searchAll(TEST_ACCOUNT_ID, {pageSize: 100, page: 1, refund_states: ['refund_success', 'refund_error']}, 'some-unique-id'))
          .to.eventually.be.fulfilled
      })

      it('should return into the correct promise when it uses the new  \'refund_states\' method of querying refund states and only one has been selected', () => {
        nock(process.env.CONNECTOR_URL)
          .get(`${TRANSACTION_SEARCH_PATH}?${getQueryStringForParams({pageSize: 100, page: 1, refund_states: 'refund_success'})}`)
          .reply(200, {})
        return expect(transactionService.searchAll(TEST_ACCOUNT_ID, {pageSize: 100, page: 1, refund_states: 'refund_success'}, 'some-unique-id'))
          .to.eventually.be.fulfilled
      })

      it('should return into the correct promise', () => {
        nock(process.env.CONNECTOR_URL)
          .get(`${TRANSACTION_SEARCH_PATH}?${getQueryStringForParams()}`)
          .reply(200, {})
        return expect(transactionService.searchAll(TEST_ACCOUNT_ID, {pageSize: 100, page: 1}, 'some-unique-id'))
          .to.eventually.be.fulfilled
      })
    })

    describe('when connector is unavailable', () => {
      it('should return client unavailable', () => {
        return expect(transactionService.searchAll(TEST_ACCOUNT_ID, {pageSize: 1, page: 100}, 'some-unique-id'))
            .to.be.rejectedWith(Error, 'CLIENT_UNAVAILABLE')
      }
      )
    })

    describe('when connector returns incorrect response code', () => {
      before(() => {
        nock(process.env.CONNECTOR_URL)
          .get(`${TRANSACTION_SEARCH_PATH}?${getQueryStringForParams()}`)
          .reply(404, '')
      })

      it('should return GET_FAILED', () => {
        return expect(transactionService.searchAll(TEST_ACCOUNT_ID, {pageSize: 100, page: 1}, 'some-unique-id'))
          .to.be.rejectedWith(Error, 'GET_FAILED')
      })
    })
  })
})
