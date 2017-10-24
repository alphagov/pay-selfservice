'use strict'
const correlator = require('correlation-id')
const config = require('../../../../app/utils/correlation_header')
const http = require('http')
const nock = require('nock')
const {expect} = require('chai')
const baseClient = require('../../../../app/services/clients/base_client/base_client')

describe('baseClient', () => {
  afterEach(() => {
    nock.cleanAll()
  })
  describe('headers', () => {
    let correlationID, request
    before(done => {
      correlationID = `${Math.floor(Math.random() * 100000) + 1}`
      nock('http://example.com').get('/').reply(200, 'success')
      correlator.withId(correlationID, () => {
        baseClient.get({url: 'http://example.com/'}, (err, response) => {
          request = response.request
          done(err)
        })
      })
    })

    it(`should set outbound request's '${config.CORRELATION_HEADER}' header to be the result of 'correlator.getId()'`, () => {
      expect(request.headers).to.have.property(config.CORRELATION_HEADER).to.equal(correlationID)
    })

    it(`should set outbound request's 'Content-Type' header to be 'application/json'`, () => {
      expect(request.headers).to.have.property('Content-Type').to.equal('application/json')
    })
  })
  describe('keepAlive', () => {
    let server
    let connections = []
    before(done => {
      server = http.createServer((req, res) => {
        res.writeHead(200)
        res.end()
      }).listen()
      baseClient
        .get({url: `http://localhost:${server.address().port}/alpha`}, captureConnection)
        .then(() => baseClient.get({url: `http://localhost:${server.address().port}/beta`}, captureConnection))
        .then(() => done())
        .catch(done)

      function captureConnection(err, response) {
        connections.push(response.connection)
      }
    })
    after(() => {
      server.close()
    })

    it('should use the same connection for 2 requests to the same domain', () => {
      expect(connections.length).to.equal(2)
      expect(connections[0] === connections[1]).to.equal(true)
    })
  })
})
