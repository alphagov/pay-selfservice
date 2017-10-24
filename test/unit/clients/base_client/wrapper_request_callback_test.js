'use strict'
const request = require('request')
const nock = require('nock')
const {expect} = require('chai')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const requestLogger = {}
const wrapper = proxyquire('../../../../app/services/clients/base_client/wrapper', {
  '../../../utils/request_logger': requestLogger
})

describe('wrapper: request scenarios', () => {
  afterEach(() => {
    nock.cleanAll()
  })
  describe('when the request returns successfully with statusCode 200', () => {
    let cb, resolved, returnee
    before(done => {
      requestLogger.logRequestStart = sinon.spy()
      requestLogger.logRequestEnd = sinon.spy()
      requestLogger.logRequestFailure = sinon.spy()
      requestLogger.logRequestError = sinon.spy()
      nock('http://example.com').get('/').reply(200, 'success')
      cb = sinon.spy()
      returnee = wrapper(request, 'get')('http://example.com/', cb)
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
    it('should call a supplied callback function with the results of the request', () => {
      expect(cb.lastCall.args[0]).to.equal(null)
      expect(cb.lastCall.args[1]).to.have.property('statusCode').to.equal(200)
      expect(cb.lastCall.args[1]).to.have.property('body').to.equal('success')
      expect(cb.lastCall.args[2]).to.equal('success')
    })
    it('should log the request start and request end but not a request failure or error', () => {
      expect(requestLogger.logRequestStart.called).to.equal(true)
      expect(requestLogger.logRequestEnd.called).to.equal(true)
      expect(requestLogger.logRequestError.called).to.equal(false)
      expect(requestLogger.logRequestFailure.called).to.equal(false)
    })
  })
  describe('when the request fails', () => {
    let cb, rejected, returnee
    before(done => {
      requestLogger.logRequestStart = sinon.spy()
      requestLogger.logRequestEnd = sinon.spy()
      requestLogger.logRequestFailure = sinon.spy()
      requestLogger.logRequestError = sinon.spy()
      nock('http://example.com').get('/').reply(404, 'not found')
      cb = sinon.spy()
      returnee = wrapper(request, 'get')('http://example.com/', cb)
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
    let cb, rejected, returnee
    before(done => {
      requestLogger.logRequestStart = sinon.spy()
      requestLogger.logRequestEnd = sinon.spy()
      requestLogger.logRequestFailure = sinon.spy()
      requestLogger.logRequestError = sinon.spy()
      nock('http://example.com').get('/').replyWithError(new Error('something simply dreadful happened'))
      cb = sinon.spy()
      returnee = wrapper(request, 'get')('http://example.com/', cb)
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
