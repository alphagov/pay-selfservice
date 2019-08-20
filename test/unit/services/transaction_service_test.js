'use strict'

const proxyquire = require('proxyquire')
const EventEmitter = require('events')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const { expect } = chai
chai.use(chaiAsPromised)

describe('transaction service', () => {
  describe('search', () => {
    describe('when connector returns correctly', () => {
      // Create a class that inherits from EventEmitter so we can replicate the .on('xxxx') functionality the code expects
      class STransactions extends EventEmitter {
        searchTransactions (params, callback) {
          callback(null, { statusCode: 200 })
          return this
        }
      }
      let sTranInst = new STransactions()
      let connectorClientStub = {
        ConnectorClient: function () {
          return sTranInst
        }
      }
      let transactionService = proxyquire('../../../app/services/transaction_service',
        {
          '../services/clients/connector_client.js': connectorClientStub
        })

      it('should return the correct promise', () => {
        return expect(transactionService.search(123, {}, 'some-unique-id'))
          .to.eventually.be.fulfilled
      })
    })

    describe('when connector is unavailable', () => {
      // Create a class that inherits from EventEmitter and emit a 'connectorError' event which is handled by the service
      class STransactions extends EventEmitter {
        searchTransactions () {
          setTimeout(() => {
            this.emit('connectorError')
          }, 100)
          return this
        }
      }
      let sTranInst = new STransactions()
      let connectorClientStub = {
        ConnectorClient: function () {
          return sTranInst
        }
      }
      let transactionService = proxyquire('../../../app/services/transaction_service',
        {
          '../services/clients/connector_client.js': connectorClientStub
        })

      it('should return client unavailable', () => {
        return expect(transactionService.search(123, {}, 'some-unique-id'))
          .to.be.rejectedWith(Error, 'CLIENT_UNAVAILABLE')
      }
      )
    })

    describe('when connector returns incorrect response code while retrieving the list of transactions', () => {
      // Create a class that inherits from EventEmitter so we can replicate the .on('xxxx') functionality the code expects
      class STransactions extends EventEmitter {
        searchTransactions (params, callback) {
          callback(null, { statusCode: 201 })
          return this
        }
      }
      let sTranInst = new STransactions()
      let connectorClientStub = {
        ConnectorClient: function () {
          return sTranInst
        }
      }
      let transactionService = proxyquire('../../../app/services/transaction_service',
        {
          '../services/clients/connector_client.js': connectorClientStub
        })

      it('should return get_failed', () => {
        return expect(transactionService.search(123, {}, 'some-unique-id'))
          .to.be.rejectedWith(Error, 'GET_FAILED')
      })
    })
  })

  describe('searchAll', () => {
    describe('when connector returns correctly', () => {
      class GaTransactions extends EventEmitter {
        getAllTransactions (params, callback) {
          callback(null, { statusCode: 200 })
          return this
        }
      }
      let gaTranInst = new GaTransactions()
      let connectorClientStub = {
        ConnectorClient: function () {
          return gaTranInst
        }
      }
      let transactionService = proxyquire('../../../app/services/transaction_service',
        {
          '../services/clients/connector_client.js': connectorClientStub
        })

      it('should return into the correct promise when it uses the legacy \'state\' method of querying states', () => {
        return expect(transactionService.searchAll(123, { pageSize: 100, page: 1, state: 'success' }, 'some-unique-id'))
          .to.eventually.be.fulfilled
      })

      it('should return into the correct promise when it uses the new  \'refund_states\' method of querying refund states and multiple have been selected', () => {
        return expect(transactionService.searchAll(123, {
          pageSize: 100,
          page: 1,
          refund_states: ['refund_success', 'refund_error'],
          refundReportingEnabled: true
        }, 'some-unique-id'))
          .to.eventually.be.fulfilled
      })

      it('should return into the correct promise when it uses the new  \'refund_states\' method of querying refund states and only one has been selected', () => {
        return expect(transactionService.searchAll(123, {
          pageSize: 100,
          page: 1,
          refund_states: 'refund_success',
          refundReportingEnabled: true
        }, 'some-unique-id'))
          .to.eventually.be.fulfilled
      })

      it('should return into the correct promise', () => {
        return expect(transactionService.searchAll(123, { pageSize: 100, page: 1 }, 'some-unique-id'))
          .to.eventually.be.fulfilled
      })
    })

    describe('when connector is unavailable', () => {
      class GaTransactions extends EventEmitter {
        getAllTransactions (params, callback) {
          setTimeout(() => {
            this.emit('connectorError')
          }, 100)
          return this
        }
      }
      let gaTranInst = new GaTransactions()
      let connectorClientStub = {
        ConnectorClient: function () {
          return gaTranInst
        }
      }
      let transactionService = proxyquire('../../../app/services/transaction_service',
        {
          '../services/clients/connector_client.js': connectorClientStub
        })

      it('should return client unavailable', () => {
        return expect(transactionService.searchAll(123, { pageSize: 1, page: 100 }, 'some-unique-id'))
          .to.be.rejectedWith(Error, 'CLIENT_UNAVAILABLE')
      }
      )
    })

    describe('when connector returns incorrect response code', () => {
      class GaTransactions extends EventEmitter {
        getAllTransactions (params, callback) {
          setTimeout(() => {
            this.emit('connectorError', null, { iam: 'an-object' })
          }, 100)
          return this
        }
      }
      let gaTranInst = new GaTransactions()
      let connectorClientStub = {
        ConnectorClient: function () {
          return gaTranInst
        }
      }
      let transactionService = proxyquire('../../../app/services/transaction_service',
        {
          '../services/clients/connector_client.js': connectorClientStub
        })

      it('should return GET_FAILED', () => {
        return expect(transactionService.searchAll(123, { pageSize: 100, page: 1 }, 'some-unique-id'))
          .to.be.rejectedWith(Error, 'GET_FAILED')
      })
    })
  })
})
