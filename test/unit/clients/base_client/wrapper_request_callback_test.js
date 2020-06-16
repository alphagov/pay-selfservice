'use strict'

// const request = require('request')
const { expect } = require('chai')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const requestLogger = {}
const events = require('events')
const util = require('util')

const wrapper = proxyquire('../../../../app/services/clients/base_client/wrapper', {
  '../../../utils/request_logger': requestLogger
})

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
    before(done => {
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
      expect(returnee.constructor).to.equal(Promise)
    })
    it('should return a promise that is resolved with the body of the successful request', () => {
      expect(resolved).to.equal('success')
    })
    it('should call a supplied callback function', () => {
      expect(cb.lastCall.args[0]).to.equal(null)
      expect(cb.lastCall.args[1]).to.have.property('statusCode').to.equal(200)
      expect(cb.lastCall.args[1]).to.have.property('body').to.equal('success')
      expect(cb.lastCall.args[2]).to.equal('success')
      expect(cb.called).to.equal(true)
    })
    it('should log the request start and request end but not a request failure or error', () => {
      expect(requestLogger.logRequestStart.called).to.equal(true)
      expect(requestLogger.logRequestEnd.called).to.equal(true)
      expect(requestLogger.logRequestError.called).to.equal(false)
      expect(requestLogger.logRequestFailure.called).to.equal(false)
    })
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
    before(done => {
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
      expect(returnee.constructor).to.equal(Promise)
    })
    it('should return a promise that is rejected with an error with a message equal to the response body and an \'errorCode\' property equal to the response code', () => {
      expect(rejected.constructor).to.equal(Error)
      expect(rejected.message).to.equal('not found')
      expect(rejected.errorCode).to.equal(404)
    })
    it('should call a supplied callback function with the results of the request', () => {
      expect(cb.lastCall.args[0]).to.equal(null)
      expect(cb.lastCall.args[1]).to.have.property('statusCode').to.equal(404)
      expect(cb.lastCall.args[1]).to.have.property('body').to.equal('not found')
      expect(cb.lastCall.args[2]).to.equal('not found')
    })
    it('should log the request start, end and failure but not a request error', () => {
      expect(requestLogger.logRequestStart.called).to.equal(true)
      expect(requestLogger.logRequestEnd.called).to.equal(true)
      expect(requestLogger.logRequestError.called).to.equal(false)
      expect(requestLogger.logRequestFailure.called).to.equal(true)
    })
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
    before(done => {
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
      expect(returnee.constructor).to.equal(Promise)
    })
    it('should return a promise that is rejected with the error that the request module returned', () => {
      expect(rejected.constructor).to.equal(Error)
      expect(rejected.message).to.equal('something simply dreadful happened')
      expect(rejected.errorCode).to.equal(undefined)
    })
    it('should call a supplied callback function with the results of the request', () => {
      expect(cb.lastCall.args[0]).to.equal(rejected)
      expect(cb.lastCall.args[1]).to.equal(undefined)
      expect(cb.lastCall.args[2]).to.equal(undefined)
    })
    it('should log the request start, end and error but not a request failure', () => {
      expect(requestLogger.logRequestStart.called).to.equal(true)
      expect(requestLogger.logRequestEnd.called).to.equal(true)
      expect(requestLogger.logRequestError.called).to.equal(true)
      expect(requestLogger.logRequestFailure.called).to.equal(false)
    })
  })
})
