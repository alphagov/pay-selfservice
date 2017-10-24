'use strict'

// NPM Dependencies
const correlator = require('correlation-id')
const {expect} = require('chai')

// Local Dependencies
const {CORRELATION_HEADER} = require('../../../app/utils/correlation_header')
const correlationMiddleware = require('../../../app/middleware/correlation_id')
let req

describe('correlation ID middleware', () => {
  beforeEach(() => {
    req = {
      headers: {}
    }
    req.headers[CORRELATION_HEADER] = `${Math.floor(Math.random() * 100000) + 1}`
  })
  it('should store a request\'s correlation id using the \'correlation-id\' npm module', done => {
    correlationMiddleware(req, {}, (err) => {
      expect(err).to.equal(undefined)
      expect(correlator.getId()).to.equal(req.headers[CORRELATION_HEADER])
      done()
    })
  })

  it('should store a request\'s correlation id on it\'s \'correlationId\' property', done => {
    correlationMiddleware(req, {}, (err) => {
      expect(err).to.equal(undefined)
      expect(req.correlationId).to.equal(req.headers[CORRELATION_HEADER])
      done()
    })
  })
})
