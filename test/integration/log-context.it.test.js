'use strict'

const express = require('express')
const request = require('supertest')
const { expect } = require('chai')

const requestContext = require('../../app/utils/request-context')

describe('Log context async storage', () => {
  const path = '/test-request-context'
  let app
  let assignedLoggingFields

  before(() => {
    app = express()
    app.use(requestContext.requestContextMiddleware)
    app.use((req, res, next) => {
      requestContext.addField('a_key', 'foo')
      next()
    })
    app.get(path, (req, res) => {
      assignedLoggingFields = requestContext.getLoggingFields()
      res.status(200)
      res.end()
    })
  })

  it('should retrieve logging fields from log context', done => {
    request(app)
      .get(path)
      .set('x-request-id', 'bar')
      .expect(200)
      .end(() => {
        expect(assignedLoggingFields).to.deep.equal({
          'x_request_id': 'bar',
          'a_key': 'foo'
        })
        done()
      })
  })
})
