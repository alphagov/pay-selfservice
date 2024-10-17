'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { CORRELATION_HEADER } = require('../../../../config')
const { CORRELATION_ID } = require('@govuk-pay/pay-js-commons').logging.keys

const { expect } = require('chai')

let asyncStorageMock = {}

function getRequestContext () {
  return proxyquire('./request-context', {
    crypto: {
      randomBytes: function () {
        return 'test-correlation-id'
      }
    },
    async_hooks: {
      AsyncLocalStorage: function () {
        return {
          getStore: function () {
            return asyncStorageMock
          },
          run: function (object, callback) {
            callback()
          }
        }
      }
    }
  })
}

describe('Request Context', () => {
  beforeEach(() => {
    asyncStorageMock = {}
  })

  it('sets the correlation id when there is no x-request-id header', () => {
    const requestContext = getRequestContext()

    const req = {
      headers: {}
    }
    const res = null
    const next = sinon.spy()

    requestContext.requestContextMiddleware(req, res, next)
    expect(asyncStorageMock[CORRELATION_ID]).to.equal('test-correlation-id')
    sinon.assert.calledWithExactly(next)
  })

  it('sets the correlation id using the x-request-id header when it exists', () => {
    const requestContext = getRequestContext()
    const xRequestIdHeaderValue = 'x-request-id-value'

    const req = {
      headers: {}
    }

    req.headers[CORRELATION_HEADER] = xRequestIdHeaderValue

    const res = null
    const next = sinon.spy()

    requestContext.requestContextMiddleware(req, res, next)
    expect(asyncStorageMock[CORRELATION_ID]).to.equal('x-request-id-value')
    sinon.assert.calledWithExactly(next)
  })

  it('check it can add a field to the request context', () => {
    const testKey = 'test-key'
    const testValue = 'test-value'

    const requestContext = getRequestContext()

    requestContext.addField(testKey, testValue)
    expect(asyncStorageMock[testKey]).to.equal(testValue)
  })

  it('get the correlation id from the async storage', () => {
    const testCorrelationId = 'test-correlation-id'
    asyncStorageMock[CORRELATION_ID] = testCorrelationId
    const requestContext = getRequestContext()

    const correlationId = requestContext.getRequestCorrelationIDField()
    expect(correlationId).to.equal(testCorrelationId)
  })

  it('get the loggingFields from the async storage', () => {
    const testKey1 = 'test-key-1'
    const testKey2 = 'test-key-2'
    const testValue1 = 'test-value-1'
    const testValue2 = 'test-value-2'

    asyncStorageMock[testKey1] = testValue1
    asyncStorageMock[testKey2] = testValue2

    const requestContext = getRequestContext()

    const loggingFields = requestContext.getLoggingFields()
    expect(loggingFields[testKey1]).to.equal(testValue1)
    expect(loggingFields[testKey2]).to.equal(testValue2)
  })
})
