'use strict'

const sinon = require('sinon')
const requestLogger = {}
const events = require('events')
const util = require('util')

jest.mock('../../../utils/request-logger', () => requestLogger);

const wrapper = require('../../../../app/services/clients/base-client/wrapper')

describe('wrapper: request scenarios', () => {
  describe('when the request returns successfully with statusCode 200', () => {
    let cb
    let resolved
    let returnee
    // Create a stubbed request object
    function RequestStub () {
      const self = this
      events.EventEmitter.call(self)
      return function (options, callback) {
        setTimeout(() => {
          // Emit a response that our test is checking for
          self.emit('response', { statusCode: 200 })
          // And execute the callback
          callback(null, { statusCode: 200, request: options, body: 'success' }, 'success')
        }, 100)
        return self
      }
    }
    // Wire the EventEmitter into it, so we can emit the event specified above to any watchers
    util.inherits(RequestStub, events.EventEmitter)
    beforeAll(done => {
      requestLogger.logRequestStart = sinon.spy()
      requestLogger.logRequestEnd = sinon.spy()
      requestLogger.logRequestFailure = sinon.spy()
      requestLogger.logRequestError = sinon.spy()
      cb = sinon.spy()
      returnee = wrapper(new RequestStub(), 'get')('http://example.com/', cb)
      returnee
        .then(result => {
          resolved = result
          done()
        })
        .catch(done)
    })
    it('should return a promise', () => {
      expect(returnee.constructor).toBe(Promise)
    })
    it(
      'should return a promise that is resolved with the body of the successful request',
      () => {
        expect(resolved).toBe('success')
      }
    )
    it('should call a supplied callback function', () => {
      expect(cb.lastCall.args[0]).toBeNull()
      expect(cb.lastCall.args[1]).to.have.property('statusCode').toBe(200)
      expect(cb.lastCall.args[1]).to.have.property('body').toBe('success')
      expect(cb.lastCall.args[2]).toBe('success')
      expect(cb.called).toBe(true)
    })
    it(
      'should log the request start and request end but not a request failure or error',
      () => {
        expect(requestLogger.logRequestStart.called).toBe(true)
        expect(requestLogger.logRequestEnd.called).toBe(true)
        expect(requestLogger.logRequestError.called).toBe(false)
        expect(requestLogger.logRequestFailure.called).toBe(false)
      }
    )
  })
  describe('when the request fails', () => {
    let cb
    let rejected
    let returnee
    // Create a stubbed request object
    function RequestStub () {
      const self = this
      events.EventEmitter.call(self)
      return function (options, callback) {
        setTimeout(() => {
          // Emit a response that our test is checking for
          self.emit('response', { statusCode: 404 })
          // And execute the callback
          callback(null, { statusCode: 404, request: options, body: 'not found' }, 'not found')
        }, 100)
        return self
      }
    }
    // Wire the EventEmitter into it, so we can emit the event specified above to any watchers
    util.inherits(RequestStub, events.EventEmitter)
    beforeAll(done => {
      requestLogger.logRequestStart = sinon.spy()
      requestLogger.logRequestEnd = sinon.spy()
      requestLogger.logRequestFailure = sinon.spy()
      requestLogger.logRequestError = sinon.spy()
      cb = sinon.spy()
      returnee = wrapper(new RequestStub(), 'get')('http://example.com/', cb)
      returnee
        .then(done)
        .catch(err => {
          rejected = err
          done()
        })
    })
    it('should return a promise', () => {
      expect(returnee.constructor).toBe(Promise)
    })
    it(
      'should return a promise that is rejected with an error with a message equal to the response body and an \'errorCode\' property equal to the response code',
      () => {
        expect(rejected.constructor).toBe(Error)
        expect(rejected.message).toBe('not found')
        expect(rejected.errorCode).toBe(404)
      }
    )
    it(
      'should call a supplied callback function with the results of the request',
      () => {
        expect(cb.lastCall.args[0]).toBeNull()
        expect(cb.lastCall.args[1]).to.have.property('statusCode').toBe(404)
        expect(cb.lastCall.args[1]).to.have.property('body').toBe('not found')
        expect(cb.lastCall.args[2]).toBe('not found')
      }
    )
    it(
      'should log the request start, end and failure but not a request error',
      () => {
        expect(requestLogger.logRequestStart.called).toBe(true)
        expect(requestLogger.logRequestEnd.called).toBe(true)
        expect(requestLogger.logRequestError.called).toBe(false)
        expect(requestLogger.logRequestFailure.called).toBe(true)
      }
    )
  })

  describe('when the request errors', () => {
    let cb
    let rejected
    let returnee
    // Create a stubbed request object
    function RequestStub () {
      const self = this
      events.EventEmitter.call(self)
      return function (options, callback) {
        setTimeout(() => {
          // Emit a response that our test is checking for
          self.emit('error', new Error('something simply dreadful happened'))
          // And execute the callback
          callback(new Error('something simply dreadful happened'))
        }, 100)
        return self
      }
    }

    // Wire the EventEmitter into it, so we can emit the event specified above to any watchers
    util.inherits(RequestStub, events.EventEmitter)
    beforeAll(done => {
      requestLogger.logRequestStart = sinon.spy()
      requestLogger.logRequestEnd = sinon.spy()
      requestLogger.logRequestFailure = sinon.spy()
      requestLogger.logRequestError = sinon.spy()
      cb = sinon.spy()
      returnee = wrapper(new RequestStub(), 'get')('http://example.com/', cb)
      returnee
        .then(done)
        .catch(err => {
          rejected = err
          done()
        })
    })
    it('should return a promise', () => {
      expect(returnee.constructor).toBe(Promise)
    })
    it(
      'should return a promise that is rejected with the error that the request module returned',
      () => {
        expect(rejected.constructor).toBe(Error)
        expect(rejected.message).toBe('something simply dreadful happened')
        expect(rejected.errorCode).toBeUndefined()
      }
    )
    it(
      'should call a supplied callback function with the results of the request',
      () => {
        expect(cb.lastCall.args[0]).toBe(rejected)
        expect(cb.lastCall.args[1]).toBeUndefined()
        expect(cb.lastCall.args[2]).toBeUndefined()
      }
    )
    it(
      'should log the request start, end and error but not a request failure',
      () => {
        expect(requestLogger.logRequestStart.called).toBe(true)
        expect(requestLogger.logRequestEnd.called).toBe(true)
        expect(requestLogger.logRequestError.called).toBe(true)
        expect(requestLogger.logRequestFailure.called).toBe(false)
      }
    )
  })
})
