'use strict'

// NPM dependencies
const lodash = require('lodash')
const sinon = require('sinon')
const {expect} = require('chai')

// Local dependencies
const restrictToSandbox = require('../../../app/middleware/restrict_to_sandbox')

describe('restrict_to_sandbox middleware', () => {
  describe('when a user is using a sandbox account', () => {
    let req, res, next
    before(done => {
      req = {}
      res = {}
      next = sinon.spy(done)
      lodash.set(req, 'account.payment_provider', 'sandbox')
      restrictToSandbox(req, res, next)
    })

    it('should call next', () => {
      expect(next.called).to.equal(true)
      expect(next.lastCall.args.length).to.equal(0)
    })
  })

  describe('when a user is not using a sandbox account', () => {
    let req, res, next
    before(done => {
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
      expect(res.render.called).to.equal(true)
      expect(res.render.lastCall.args[0]).to.equal('error')
      expect(res.render.lastCall.args[1]).to.have.property('message').to.equal('This page is only available on Sandbox accounts')
    })

    it('should render the error view with code 403: forbidden', () => {
      expect(res.status.called).to.equal(true)
      expect(res.status.lastCall.args[0]).to.equal(403)
    })
  })
})
