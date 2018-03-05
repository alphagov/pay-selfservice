'use strict'

// NPM Dependencies
const nock = require('nock')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Local Dependencies
const transactionService = require('../../../app/services/transaction_service')
const getQueryStringForParams = require('../../../app/utils/get_query_string_for_params')

const V2_CHARGES_API_PATH = '/v2/api/accounts/123/charges?'

const {expect} = chai
chai.use(chaiAsPromised)

describe('transaction service', () => {
  afterEach(() => nock.cleanAll())

  describe('search', () => {
    describe('when connector returns correctly', () => {
      before(() => {
        nock.cleanAll()

        nock(process.env.CONNECTOR_URL)
          .get(`${V2_CHARGES_API_PATH + getQueryStringForParams()}`)
          .reply(200, {})
      })

      it('should return the correct promise', () => {
        return expect(transactionService.search(123, {}, 'some-unique-id'))
          .to.eventually.be.fulfilled
      })
    })

    describe('when connector is unavailable', () => {
      it('should return client unavailable', () => {
        return expect(transactionService.search(123, {}, 'some-unique-id'))
            .to.be.rejectedWith(Error, 'CLIENT_UNAVAILABLE')
      }
      )
    })

    describe('when connector returns incorrect response code while retrieving the list of transactions', () => {
      before(() => {
        nock(process.env.CONNECTOR_URL)
          .get(`${V2_CHARGES_API_PATH + getQueryStringForParams()}`)
          .reply(404, '')
      })

      it('should return get_failed', () => {
        return expect(transactionService.search(123, {}, 'some-unique-id'))
          .to.be.rejectedWith(Error, 'GET_FAILED')
      })
    })
  })

  describe('searchAll', () => {
    describe('when connector returns correctly', () => {
      it('should return into the correct promise when it uses the legacy \'state\' method of querying states', () => {
        nock(process.env.CONNECTOR_URL)
          .get(`${V2_CHARGES_API_PATH + getQueryStringForParams({pageSize: 100, page: 1, state: 'success'})}`)
          .reply(200, {})
        return expect(transactionService.searchAll(123, {pageSize: 100, page: 1, state: 'success'}, 'some-unique-id'))
          .to.eventually.be.fulfilled
      })

      it('should return into the correct promise when it uses the new  \'refund_states\' method of querying refund states and multiple have been selected', () => {
        nock(process.env.CONNECTOR_URL)
          .get(`${V2_CHARGES_API_PATH + getQueryStringForParams({pageSize: 100, page: 1, refund_states: ['refund_success', 'refund_error'], refundReportingEnabled: true})}`)
          .reply(200, {})
        return expect(transactionService.searchAll(123, {pageSize: 100, page: 1, refund_states: ['refund_success', 'refund_error'], refundReportingEnabled: true}, 'some-unique-id'))
          .to.eventually.be.fulfilled
      })

      it('should return into the correct promise when it uses the new  \'refund_states\' method of querying refund states and only one has been selected', () => {
        nock(process.env.CONNECTOR_URL)
          .get(`${V2_CHARGES_API_PATH + getQueryStringForParams({pageSize: 100, page: 1, refund_states: 'refund_success', refundReportingEnabled: true})}`)
          .reply(200, {})
        return expect(transactionService.searchAll(123, {pageSize: 100, page: 1, refund_states: 'refund_success', refundReportingEnabled: true}, 'some-unique-id'))
          .to.eventually.be.fulfilled
      })

      it('should return into the correct promise', () => {
        nock(process.env.CONNECTOR_URL)
          .get(`${V2_CHARGES_API_PATH + getQueryStringForParams()}`)
          .reply(200, {})
        return expect(transactionService.searchAll(123, {pageSize: 100, page: 1}, 'some-unique-id'))
          .to.eventually.be.fulfilled
      })
    })

    describe('when connector is unavailable', () => {
      it('should return client unavailable', () => {
        return expect(transactionService.searchAll(123, {pageSize: 1, page: 100}, 'some-unique-id'))
            .to.be.rejectedWith(Error, 'CLIENT_UNAVAILABLE')
      }
      )
    })

    describe('when connector returns incorrect response code', () => {
      before(() => {
        nock(process.env.CONNECTOR_URL)
          .get(`${V2_CHARGES_API_PATH + getQueryStringForParams()}`)
          .reply(404, '')
      })

      it('should return GET_FAILED', () => {
        return expect(transactionService.searchAll(123, {pageSize: 100, page: 1}, 'some-unique-id'))
          .to.be.rejectedWith(Error, 'GET_FAILED')
      })
    })
  })
})
