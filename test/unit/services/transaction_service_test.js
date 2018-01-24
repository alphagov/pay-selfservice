'use strict'

// NPM Dependencies
const nock = require('nock')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Local Dependencies
const transactionService = require('../../../app/services/transaction_service')

const {expect} = chai
chai.use(chaiAsPromised)

describe('transaction service', () => {
  afterEach(() => nock.cleanAll())

  describe('search', () => {
    describe('when connector returns correctly', () => {
      before(() => {
        nock.cleanAll()

        nock(process.env.CONNECTOR_URL)
          .get('/v1/api/accounts/123/charges?reference=&email=&state=&card_brand=&from_date=&to_date=&page=1&display_size=100')
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
          .get('/v1/api/accounts/123/charges?reference=&email=&state=&card_brand=&from_date=&to_date=&page=1&display_size=100')
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
      before(() => {
        nock(process.env.CONNECTOR_URL)
          .get('/v1/api/accounts/123/charges?reference=&email=&state=&card_brand=&from_date=&to_date=&page=1&display_size=100')
          .reply(200, {})
      })

      it('should return into the correct promise', () => {
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
          .get('/v1/api/accounts/123/charges?reference=&email=&state=&card_brand=&from_date=&to_date=&page=1&display_size=100')
          .reply(404, '')
      })

      it('should return GET_FAILED', () => {
        return expect(transactionService.searchAll(123, {pageSize: 100, page: 1}, 'some-unique-id'))
          .to.be.rejectedWith(Error, 'GET_FAILED')
      })
    })
  })
})
