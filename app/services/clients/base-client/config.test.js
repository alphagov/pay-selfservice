'use strict'

const nock = require('nock')
const proxyquire = require('proxyquire')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const { Client } = require('./axios-base-client')

chai.use(chaiAsPromised)
const { expect } = chai

const baseUrl = 'http://localhost:8000'
const app = 'an-app'

function getConfigWithMockedRequestContext (correlationId) {
  const config = proxyquire('./config.js', {
    '../../../utils/request-context': {
      getRequestCorrelationIDField: () => correlationId
    }
  })
  return config
}

describe('Client config', () => {
  it('should add correlation ID as header when correlation ID exists on request context', () => {
    const client = new Client(app)
    const config = getConfigWithMockedRequestContext('abc123')
    config.configureClient(client, baseUrl)

    nock(baseUrl)
      .get('/')
      .reply(200)
    return expect(client._axios.get('/', { description: 'foo' })).to.be.fulfilled.then((response) => {
      expect(response.request.headers).to.have.property('x-request-id', 'abc123')
    })
  })

  it('should not add correlation ID as header when correlation ID does not exist on request context', () => {
    const client = new Client(app)
    const config = getConfigWithMockedRequestContext()
    config.configureClient(client, baseUrl)

    nock(baseUrl)
      .get('/')
      .reply(200)
    return expect(client._axios.get('/', { description: 'foo' })).to.be.fulfilled.then((response) => {
      expect(response.request.headers).to.not.have.key('x-request-id')
    })
  })
})
