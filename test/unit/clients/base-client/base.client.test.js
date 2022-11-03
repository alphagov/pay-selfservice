'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const events = require('events')
const { EventEmitter } = require('events')
const util = require('util')
const { RESTClientError } = require('../../../../app/errors')

const expect = chai.expect
chai.use(chaiAsPromised)

const correlationId = 'a-correlation-id'
const requestLogger = {
  logRequestStart: sinon.spy(),
  logRequestEnd: sinon.spy(),
  logRequestFailure: sinon.spy(),
  logRequestError: sinon.spy()
}
let requestOptions

function RequestSuccessStub (response, responseBody) {
  const self = this
  EventEmitter.call(self)
  return function (options, callback) {
    setTimeout(() => {
      // Emit a response event which is handled in the client to log the response
      self.emit('response', response)

      // Record the request options so we can do assertions on them in tests
      requestOptions = options

      // Execute callback to simulate the response from the service
      callback(null, response, responseBody)
    }, 100)
    return self
  }
}

function RequestErrorStub () {
  const self = this
  events.EventEmitter.call(self)
  return function (options, callback) {
    setTimeout(() => {
      // Emit an error event which is handled in the client to log the request error
      self.emit('error', new Error('something simply dreadful happened'))
      callback(new Error('something simply dreadful happened'))
    }, 100)
    return self
  }
}

// Wire the EventEmitter into the stubs to mimic the behaviour of the request library
util.inherits(RequestSuccessStub, EventEmitter)
util.inherits(RequestErrorStub, EventEmitter)

function getBaseClientWithSuccessStub (response, responseBody) {
  return proxyquire('../../../../app/services/clients/base-client/base.client', {
    '../../../utils/request-logger': requestLogger,
    '../../../utils/request-context': {
      getRequestCorrelationIDField: () => { return correlationId }
    },
    'request': new RequestSuccessStub(response, responseBody)
  })
}

function getBaseClientWithErrorStub () {
  return proxyquire('../../../../app/services/clients/base-client/base.client', {
    '../../../utils/request-logger': requestLogger,
    '../../../utils/request-context': {
      getRequestCorrelationIDField: () => { return correlationId }
    },
    'request': new RequestErrorStub()
  })
}

describe('Base client', () => {
  beforeEach(() => {
    requestLogger.logRequestStart.resetHistory()
    requestLogger.logRequestEnd.resetHistory()
    requestLogger.logRequestFailure.resetHistory()
    requestLogger.logRequestError.resetHistory()
    requestOptions = null
  })

  describe('Request returns a success response', () => {
    const response = { statusCode: 200 }
    const responseBody = { result: 'success' }
    const baseClient = getBaseClientWithSuccessStub(response, responseBody)

    it('should resolve with the response body', () => {
      return expect(baseClient.get({ url: 'http://example.com/' })).to.be.fulfilled.then(resolved => {
        expect(resolved).to.have.property('result', 'success')

        expect(requestOptions).to.have.property('headers')
        expect(requestOptions.headers).to.deep.equal({
          'x-request-id': correlationId,
          'Content-Type': 'application/json'
        })
        expect(requestOptions).to.have.property('method')
        expect(requestOptions.method).to.equal('GET')

        expect(requestLogger.logRequestStart.called).to.equal(true)
        expect(requestLogger.logRequestEnd.called).to.equal(true)
        expect(requestLogger.logRequestError.called).to.equal(false)
        expect(requestLogger.logRequestFailure.called).to.equal(false)
      })
    })
  })

  describe('Request returns non-success response', () => {
    describe('The request returns a non-success response with text content type', () => {
      const response = { statusCode: 404 }
      const responseBody = 'not found'
      const baseClient = getBaseClientWithSuccessStub(response, responseBody)

      it('should reject with an error', () => {
        return expect(baseClient.get({ url: 'http://example.com/' }))
          .to.be.rejected.then(error => {
            expect(error.constructor).to.equal(RESTClientError)
            expect(error.message).to.equal('not found')
            expect(error.errorCode).to.equal(404)
            expect(error.errorIdentifier).to.equal(undefined)
            expect(error.reason).to.equal(undefined)

            expect(requestLogger.logRequestStart.called).to.equal(true)
            expect(requestLogger.logRequestEnd.called).to.equal(true)
            expect(requestLogger.logRequestError.called).to.equal(false)
            expect(requestLogger.logRequestFailure.called).to.equal(true)
          })
      })
    })

    describe('The request returns a non-success response with JSON content type containing an "errors" field of type array', () => {
      const response = { statusCode: 404 }
      const responseBody = {
        errors: ['First error', 'Second error'],
        error_identifier: 'GENERIC',
        reason: 'a reason'
      }
      const baseClient = getBaseClientWithSuccessStub(response, responseBody)

      it('should reject with an error', () => {
        return expect(baseClient.get({ url: 'http://example.com/' }))
          .to.be.rejected.then(error => {
            expect(error.constructor).to.equal(RESTClientError)
            expect(error.message).to.equal('First error, Second error')
            expect(error.errorCode).to.equal(404)
            expect(error.errorIdentifier).to.equal('GENERIC')
            expect(error.reason).to.equal('a reason')

            expect(requestLogger.logRequestStart.called).to.equal(true)
            expect(requestLogger.logRequestEnd.called).to.equal(true)
            expect(requestLogger.logRequestError.called).to.equal(false)
            expect(requestLogger.logRequestFailure.called).to.equal(true)
          })
      })
    })

    describe('The request returns a non-success response with JSON content type containing a "message" field of type array', () => {
      const response = { statusCode: 404 }
      const responseBody = {
        message: ['First error', 'Second error'],
        error_identifier: 'GENERIC',
        reason: 'a reason'
      }
      const baseClient = getBaseClientWithSuccessStub(response, responseBody)

      it('should reject with an error', () => {
        return expect(baseClient.get({ url: 'http://example.com/' }))
          .to.be.rejected.then(error => {
            expect(error.constructor).to.equal(RESTClientError)
            expect(error.message).to.equal('First error, Second error')
            expect(error.errorCode).to.equal(404)
            expect(error.errorIdentifier).to.equal('GENERIC')
            expect(error.reason).to.equal('a reason')

            expect(requestLogger.logRequestStart.called).to.equal(true)
            expect(requestLogger.logRequestEnd.called).to.equal(true)
            expect(requestLogger.logRequestError.called).to.equal(false)
            expect(requestLogger.logRequestFailure.called).to.equal(true)
          })
      })
    })

    describe('The request returns a non-success response with JSON content type containing a "message" field of type string', () => {
      const response = { statusCode: 404 }
      const responseBody = {
        message: 'The only error',
        error_identifier: 'GENERIC',
        reason: 'a reason'
      }
      const baseClient = getBaseClientWithSuccessStub(response, responseBody)

      it('should reject with an error', () => {
        return expect(baseClient.get({ url: 'http://example.com/' }))
          .to.be.rejected.then(error => {
            expect(error.constructor).to.equal(RESTClientError)
            expect(error.message).to.equal('The only error')
            expect(error.errorCode).to.equal(404)
            expect(error.errorIdentifier).to.equal('GENERIC')
            expect(error.reason).to.equal('a reason')

            expect(requestLogger.logRequestStart.called).to.equal(true)
            expect(requestLogger.logRequestEnd.called).to.equal(true)
            expect(requestLogger.logRequestError.called).to.equal(false)
            expect(requestLogger.logRequestFailure.called).to.equal(true)
          })
      })
    })

    describe('The request returns a non-success response with no body', () => {
      const response = { statusCode: 404 }
      const baseClient = getBaseClientWithSuccessStub(response, null)

      it('should reject with an error', () => {
        return expect(baseClient.get({ url: 'http://example.com/' }))
          .to.be.rejected.then(error => {
            expect(error.constructor).to.equal(RESTClientError)
            expect(error.message).to.equal('Unknown error')
            expect(error.errorCode).to.equal(404)
            expect(error.errorIdentifier).to.equal(null)
            expect(error.reason).to.equal(null)

            expect(requestLogger.logRequestStart.called).to.equal(true)
            expect(requestLogger.logRequestEnd.called).to.equal(true)
            expect(requestLogger.logRequestError.called).to.equal(false)
            expect(requestLogger.logRequestFailure.called).to.equal(true)
          })
      })
    })
  })

  describe('There is an expected error making a request', () => {
    const baseClient = getBaseClientWithErrorStub()

    it('should reject with a generic error', () => {
      return expect(baseClient.get({ url: 'http://example.com/' }))
        .to.be.rejected.then(error => {
          expect(error.constructor).to.equal(Error)
          expect(error.message).to.equal('something simply dreadful happened')
          expect(error.errorCode).to.equal(undefined)

          expect(requestLogger.logRequestStart.called).to.equal(true)
          expect(requestLogger.logRequestEnd.called).to.equal(true)
          expect(requestLogger.logRequestError.called).to.equal(true)
          expect(requestLogger.logRequestFailure.called).to.equal(false)
        })
    })
  })
})
