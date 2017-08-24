'use strict'

const {expect} = require('chai')
const sinon = require('sinon')
const {middleware, getRequestContext} = require('../../../app/middleware/get_request_context')
let res, req, next

describe('get-request-context', () => {
  describe('when the request has a correlation id', () => {
    before(() => {
      req = {
        correlationId: 'abc123',
        user: {
          features: ['feature1', 'feature2']
        }
      }
      res = {
        on: sinon.spy()
      }
      next = sinon.spy()

      middleware(req, res, next)
    })

    it('should store information for the duration of the request', () => {
      expect(getRequestContext('abc123')).property('features').to.deep.equal(['feature1', 'feature2'])
    })

    it('should register an \'on finish\' listener to delete the information after the request completes', () => {
      expect(res.on.calledWith('finish')).to.equal(true)
      res.on.args[0][1]() // Call finish listener callback
      expect(getRequestContext('abc123')).to.equal(undefined)
    })

    it('should call next', () => {
      expect(next.called).to.equal(true)
    })
  })

  describe('when the request has no correlation id', () => {
    before(() => {
      req = {
        user: {
          features: ['feature1', 'feature2']
        }
      }
      res = {
        on: sinon.spy()
      }
      next = sinon.spy()

      middleware(req, res, next)
    })

    it('should not store any information', () => {
      expect(getRequestContext('abc123')).to.equal(undefined)
    })

    it('should not register an \'on finish\' listener', () => {
      expect(res.on.called).to.equal(false)
    })

    it('should call next', () => {
      expect(next.called).to.equal(true)
    })
  })
})
