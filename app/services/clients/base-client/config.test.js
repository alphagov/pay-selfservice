'use strict'

const nock = require('nock')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const { Client } = require('./axios-base-client')

chai.use(chaiAsPromised)
const { expect } = chai

const baseUrl = 'http://localhost:8000'
const app = 'an-app'

const logInfoSpy = sinon.spy()

function getConfigWithMocks (correlationId) {
  const config = proxyquire('./config.js', {
    '../../../utils/request-context': {
      getRequestCorrelationIDField: () => correlationId
    },
    '../../../utils/request-logger': proxyquire('../../../utils/request-logger', {
      './logger': () => ({
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
    it('should add correlation ID as header when correlation ID exists on request context', () => {
      const client = new Client(app)
      const config = getConfigWithMocks('abc123')
      config.configureClient(client, baseUrl)

      nock(baseUrl)
        .get('/')
        .reply(200)
      return expect(client.get('/', 'foo')).to.be.fulfilled.then((response) => {
        expect(response.request.headers).to.have.property('x-request-id', 'abc123')
      })
    })

    it('should not add correlation ID as header when correlation ID does not exist on request context', () => {
      const client = new Client(app)
      const config = getConfigWithMocks()
      config.configureClient(client, baseUrl)

      nock(baseUrl)
        .get('/')
        .reply(200)
      return expect(client.get('/', 'foo')).to.be.fulfilled.then((response) => {
        expect(response.request.headers).to.not.have.key('x-request-id')
      })
    })
  })

  describe('Logging', () => {
    it('should log request start', () => {
      const client = new Client(app)
      const config = getConfigWithMocks('abc123')
      config.configureClient(client, baseUrl)

      nock(baseUrl)
        .get('/')
        .reply(200)
      return expect(client.get('/', 'do something', {
        additionalLoggingFields: {
          foo: 'bar'
        }
      })).to.be.fulfilled.then((response) => {
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
})
