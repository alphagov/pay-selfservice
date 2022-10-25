'use strict'

const { expect } = require('chai')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const requestLogger = {}
const events = require('events')
const util = require('util')

const correlationId = 'a-correlation-id'

const wrapper = proxyquire('../../../../app/services/clients/base-client/wrapper', {
  '../../../utils/request-logger': requestLogger,
  'correlation-id': {
    getId: () => { return correlationId }
  }
})

describe('wrapper: request scenarios', () => {
  describe('when the request returns successfully with statusCode 200', () => {
    let resolved
    let returnee

    // Create a stubbed request object
    function RequestStub () {
      const self = this
      events.EventEmitter.call(self)
      return function (options, callback) {
        setTimeout(() => {
          const response = { statusCode: 200 }
          // Put the request options in the body, as this allows us to do assertions on the options used
          const body = { result: 'success', requestOptions: options }
          // Emit a response event which is handled in the wrapper to log the response
          self.emit('response', response)
          // Execute callback to simulate the response from the service
          callback(null, response, body)
        }, 100)
        return self
      }
    }

    // Wire the EventEmitter into it, so we can emit the event specified above to any watchers
    util.inherits(RequestStub, events.EventEmitter)

    before(done => {
      requestLogger.logRequestStart = sinon.spy()
      requestLogger.logRequestEnd = sinon.spy()
      requestLogger.logRequestFailure = sinon.spy()
      requestLogger.logRequestError = sinon.spy()
      returnee = wrapper(new RequestStub(), 'get')({ url: 'http://example.com/' })
      returnee
        .then(result => {
          resolved = result
          done()
        })
        .catch(done)
    })
    it('should return a promise', () => {
      expect(returnee.constructor).to.equal(Promise)
    })
    it('should return a promise that is resolved with the body of the successful request', () => {
      expect(resolved).to.have.property('result', 'success')
    })
    it('request should have been called with correct headers', () => {
      expect(resolved.requestOptions).to.have.property('headers')
      expect(resolved.requestOptions.headers).to.deep.equal({
        'x-request-id': correlationId,
        'Content-Type': 'application/json'
      })
    })
    it('should log the request start and request end but not a request failure or error', () => {
      expect(requestLogger.logRequestStart.called).to.equal(true)
      expect(requestLogger.logRequestEnd.called).to.equal(true)
      expect(requestLogger.logRequestError.called).to.equal(false)
      expect(requestLogger.logRequestFailure.called).to.equal(false)
    })
  })
  describe('when the request fails', () => {
    let rejected
    let returnee

    // Create a stubbed request object
    function RequestStub () {
      const self = this
      events.EventEmitter.call(self)
      return function (options, callback) {
        setTimeout(() => {
          // Emit a response event which is handled in the wrapper to log the response
          self.emit('response', { statusCode: 404 })
          // Execute callback to simulate the response from the service
          callback(null, { statusCode: 404, request: options, body: 'not found' }, 'not found')
        }, 100)
        return self
      }
    }

    // Wire the EventEmitter into it, so we can emit the event specified above to any watchers
    util.inherits(RequestStub, events.EventEmitter)
    before(done => {
      requestLogger.logRequestStart = sinon.spy()
      requestLogger.logRequestEnd = sinon.spy()
      requestLogger.logRequestFailure = sinon.spy()
      requestLogger.logRequestError = sinon.spy()

      returnee = wrapper(new RequestStub(), 'get')({ url: 'http://example.com/' })
      returnee
        .then(done)
        .catch(err => {
          rejected = err
          done()
        })
    })
    it('should return a promise', () => {
      expect(returnee.constructor).to.equal(Promise)
    })
    it('should return a promise that is rejected with an error with a message equal to the response body and an \'errorCode\' property equal to the response code', () => {
      expect(rejected.constructor).to.equal(Error)
      expect(rejected.message).to.equal('not found')
      expect(rejected.errorCode).to.equal(404)
    })
    it('should log the request start, end and failure but not a request error', () => {
      expect(requestLogger.logRequestStart.called).to.equal(true)
      expect(requestLogger.logRequestEnd.called).to.equal(true)
      expect(requestLogger.logRequestError.called).to.equal(false)
      expect(requestLogger.logRequestFailure.called).to.equal(true)
    })
  })

  describe('when the request errors', () => {
    let rejected
    let returnee

    // Create a stubbed request object
    function RequestStub () {
      const self = this
      events.EventEmitter.call(self)
      return function (options, callback) {
        setTimeout(() => {
          // Emit an error event which is handled in the wrapper to log the request error
          self.emit('error', new Error('something simply dreadful happened'))
          callback(new Error('something simply dreadful happened'))
        }, 100)
        return self
      }
    }

    // Wire the EventEmitter into it, so we can emit the event specified above to any watchers
    util.inherits(RequestStub, events.EventEmitter)
    before(done => {
      requestLogger.logRequestStart = sinon.spy()
      requestLogger.logRequestEnd = sinon.spy()
      requestLogger.logRequestFailure = sinon.spy()
      requestLogger.logRequestError = sinon.spy()
      returnee = wrapper(new RequestStub(), 'get')({ url: 'http://example.com/' })
      returnee
        .then(done)
        .catch(err => {
          rejected = err
          done()
        })
    })
    it('should return a promise', () => {
      expect(returnee.constructor).to.equal(Promise)
    })
    it('should return a promise that is rejected with the error that the request module returned', () => {
      expect(rejected.constructor).to.equal(Error)
      expect(rejected.message).to.equal('something simply dreadful happened')
      expect(rejected.errorCode).to.equal(undefined)
    })
    it('should log the request start, end and error but not a request failure', () => {
      expect(requestLogger.logRequestStart.called).to.equal(true)
      expect(requestLogger.logRequestEnd.called).to.equal(true)
      expect(requestLogger.logRequestError.called).to.equal(true)
      expect(requestLogger.logRequestFailure.called).to.equal(false)
    })
  })
})
