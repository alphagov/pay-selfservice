'use strict'

const lodash = require('lodash')
const sinon = require('sinon')

const restrictToSandbox = require('../../../app/middleware/restrict-to-sandbox')

describe('restrict-to-sandbox middleware', () => {
  describe('when a user is using a sandbox account', () => {
    let req, res, next
    beforeAll(done => {
      req = {}
      res = {}
      next = sinon.spy(done)
      lodash.set(req, 'account.payment_provider', 'sandbox')
      restrictToSandbox(req, res, next)
    })

    it('should call next', () => {
      expect(next.called).toBe(true)
      expect(next.lastCall.args.length).toBe(0)
    })
  })

  describe('when a user is not using a sandbox account', () => {
    let req, res, next
    beforeAll(done => {
      req = {}
      res = {}
      lodash.set(req, 'account.payment_provider', 'worldpay')
      lodash.set(res, 'render', sinon.spy(() => done()))
      res.render = sinon.spy(() => done())
      res.status = sinon.spy()
      res.setHeader = () => {}
      restrictToSandbox(req, res, next)
    })

    it('should render the error view with the correct message', () => {
      expect(res.render.called).toBe(true)
      expect(res.render.lastCall.args[0]).toBe('error')
      expect(res.render.lastCall.args[1]).to.have.property('message').toBe('This page is only available on Sandbox accounts')
    })

    it('should render the error view with code 403: forbidden', () => {
      expect(res.status.called).toBe(true)
      expect(res.status.lastCall.args[0]).toBe(403)
    })
  })
})
