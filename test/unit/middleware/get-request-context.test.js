'use strict'

const sinon = require('sinon')
const { middleware, getRequestContext } = require('../../../app/middleware/get-request-context')
let res, req, next

describe('get-request-context', () => {
  describe('when the request has a correlation id', () => {
    beforeAll(() => {
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
      expect(getRequestContext('abc123')).property('features').toEqual(['feature1', 'feature2'])
    })

    it(
      'should register an \'on finish\' listener to delete the information after the request completes',
      () => {
        expect(res.on.calledWith('finish')).toBe(true)
        res.on.args[0][1]() // Call finish listener callback
        expect(getRequestContext('abc123')).toBeUndefined()
      }
    )

    it('should call next', () => {
      expect(next.called).toBe(true)
    })
  })

  describe('when the request has no correlation id', () => {
    beforeAll(() => {
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
      expect(getRequestContext('abc123')).toBeUndefined()
    })

    it('should not register an \'on finish\' listener', () => {
      expect(res.on.called).toBe(false)
    })

    it('should call next', () => {
      expect(next.called).toBe(true)
    })
  })
})
