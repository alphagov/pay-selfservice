'use strict'

const nock = require('nock')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const { expect } = require('chai')
const { Client } = require('@govuk-pay/pay-js-commons/lib/utils/axios-base-client/axios-base-client')

const baseUrl = 'http://localhost:8000'
const app = 'an-app'

const logInfoSpy = sinon.spy()

function getConfigWithMocks (correlationId) {
  const config = proxyquire('./config.js', {
    './request-context': {
      getRequestCorrelationIDField: () => correlationId
    },
    './request-logger': proxyquire('./request-logger', {
      '../../../utils/logger': () => ({
        info: logInfoSpy
      })
    })
  })
  return config
}

describe('Client config', () => {
  beforeEach(() => {
    logInfoSpy.resetHistory()
  })

  describe('Headers', () => {
    it('should add correlation ID as header when correlation ID exists on request context', async () => {
      const client = new Client(app)
      const config = getConfigWithMocks('abc123')

      config.configureClient(client, baseUrl)

      nock(baseUrl)
        .get('/')
        .reply(200)

      const response = await client.get('/', 'foo')

      expect(response.status).to.equal(200)
      expect(response.request.headers).to.have.property('x-request-id', 'abc123')
    })

    it('should not add correlation ID as header when correlation ID does not exist on request context', async () => {
      const client = new Client(app)
      const config = getConfigWithMocks()
      config.configureClient(client, baseUrl)

      nock(baseUrl)
        .get('/')
        .reply(200)

      const response = await client.get('/', 'foo')
      expect(response.status).to.equal(200)
      expect(response.request.headers).to.not.have.key('x-request-id')
    })
  })

  describe('Logging', () => {
    it('should log request start', async () => {
      const client = new Client(app)
      const config = getConfigWithMocks('abc123')
      config.configureClient(client, baseUrl)

      nock(baseUrl)
        .get('/')
        .reply(200)

      const response = await client.get('/', 'do something', {
        additionalLoggingFields: { foo: 'bar' }
      })

      expect(response.status).to.equal(200)

      sinon.assert.calledWith(logInfoSpy, 'Calling an-app to do something', {
        service: app,
        method: 'get',
        url: '/',
        description: 'do something',
        foo: 'bar'
      })
    })
  })
})
