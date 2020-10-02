'use strict'

const correlator = require('correlation-id')
const http = require('http')

const config = require('../../../../app/utils/correlation-header')

jest.mock('requestretry', () => requestRetryStub);

describe('baseClient', () => {
  const requestRetryStub = {
    defaults: function () {
      return function (options, callback) {
        callback(null, { statusCode: 200, request: options })
      }
    }
  }
  const baseClient = require('../../../../app/services/clients/base-client/base.client')

  describe('headers', () => {
    let correlationID, request
    beforeAll(done => {
      correlationID = `${Math.floor(Math.random() * 100000) + 1}`
      correlator.withId(correlationID, () => {
        baseClient.get({ url: 'http://example.com/' }, (err, response) => {
          request = response.request
          done(err)
        })
      })
    })

    it(
      `should set outbound request's '${config.CORRELATION_HEADER}' header to be the result of 'correlator.getId()'`,
      () => {
        expect(request.headers).to.have.property(config.CORRELATION_HEADER).toBe(correlationID)
      }
    )

    it(
      `should set outbound request's 'Content-Type' header to be 'application/json'`,
      () => {
        expect(request.headers).to.have.property('Content-Type').toBe('application/json')
      }
    )
  })
  describe('keepAlive', () => {
    let server
    let connections = []
    beforeAll(done => {
      server = http.createServer((req, res) => {
        res.writeHead(200)
        res.end()
      }).listen()
      baseClient
        .get({ url: `http://localhost:${server.address().port}/alpha` }, captureConnection)
        .then(() => baseClient.get({ url: `http://localhost:${server.address().port}/beta` }, captureConnection))
        .then(() => done())
        .catch(done)

      function captureConnection (ignoreableError, response) {
        connections.push(response.connection)
      }
    })
    afterAll(() => {
      server.close()
    })

    it(
      'should use the same connection for 2 requests to the same domain',
      () => {
        expect(connections.length).toBe(2)
        expect(connections[0] === connections[1]).toBe(true)
      }
    )
  })
})
