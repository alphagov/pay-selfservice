'use strict'

const correlator = require('correlation-id')

const { CORRELATION_HEADER } = require('../../../app/utils/correlation-header')
const correlationMiddleware = require('../../../app/middleware/correlation-id')
let req

describe('correlation ID middleware', () => {
  beforeEach(() => {
    req = {
      headers: {}
    }
    req.headers[CORRELATION_HEADER] = `${Math.floor(Math.random() * 100000) + 1}`
  })
  it(
    'should store a request\'s correlation id using the \'correlation-id\' npm module',
    done => {
      correlationMiddleware(req, {}, (err) => {
        expect(err).toBeUndefined()
        expect(correlator.getId()).toBe(req.headers[CORRELATION_HEADER])
        done()
      })
    }
  )

  it(
    'should store a request\'s correlation id on it\'s \'correlationId\' property',
    done => {
      correlationMiddleware(req, {}, (err) => {
        expect(err).toBeUndefined()
        expect(req.correlationId).toBe(req.headers[CORRELATION_HEADER])
        done()
      })
    }
  )
})
