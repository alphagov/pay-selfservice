'use strict'

const path = require('path')
const assert = require('assert')

const proxyquire = require('proxyquire')
const sinon = require('sinon')

describe('error_handler middleware', function () {
  let loggerErrorSpy
  let errorHandler

  beforeEach(() => {
    loggerErrorSpy = sinon.spy()
    errorHandler = proxyquire(path.join(__dirname, '/../../../app/middleware/error-logger'), {
      '../utils/logger': () => {
        return {
          error: loggerErrorSpy
        }
      }
    })
  })

  it('should log string error', function (done) {
    const err = 'Error text'
    const req = {
      originalUrl: 'originalUrl',
      url: 'url',
      correlationId: 'correlationId'
    }
    const res = {}
    const next = sinon.spy()

    errorHandler(err, req, res, next)

    const errorPayload = {
      request: {
        originalUrl: req.originalUrl,
        url: req.url
      },
      error: {
        message: err
      }
    }
    assert(loggerErrorSpy.calledWith(`[requestId=${req.correlationId}] Internal server error`, errorPayload))
    assert(next.calledWith(err))

    done()
  })

  it('should log object error', function (done) {
    const err = {
      message: 'error message',
      stack: 'error stack'
    }
    const req = {
      originalUrl: 'originalUrl',
      url: 'url',
      correlationId: 'correlationId'
    }
    const res = {}
    const next = sinon.spy()

    errorHandler(err, req, res, next)

    const errorPayload = {
      request: {
        originalUrl: req.originalUrl,
        url: req.url
      },
      error: {
        message: err.message,
        stack: err.stack
      }
    }
    assert(loggerErrorSpy.calledWith(`[requestId=${req.correlationId}] Internal server error`, errorPayload))
    assert(next.calledWith(err))

    done()
  })
})
