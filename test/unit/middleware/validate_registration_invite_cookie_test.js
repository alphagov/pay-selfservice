'use strict'

// NPM dependencies
const proxyquire = require('proxyquire')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const sinon = require('sinon')

// Constants
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

describe('validate registration invite cookie middleware', function () {

  it('should call next when called with valid register_invite object', function (done) {
    const validateRegistrationInviteCookie = require('../../../app/middleware/validate_registration_invite_cookie')

    const req = {
      correlationId: 'a-correlationId',
      register_invite: {
        code: 'a-code',
        email: 'a-user@gov.uk'
      }
    }
    const res = {}
    const next = sinon.spy()

    validateRegistrationInviteCookie(req, res, next).should.be.fulfilled.then(valid => {
      expect(next.called).to.be.true
    }).should.notify(done)
  })

  it('should render error view when called with empty register_invite object', function (done) {
    const renderErrorViewSpy = sinon.spy()
    const validateRegistrationInviteCookie = proxyquire('../../../app/middleware/validate_registration_invite_cookie', {
      '../utils/response': {
        renderErrorView: renderErrorViewSpy
      }
    })

    const req = {
      correlationId: 'a-correlationId',
      register_invite: {}
    }
    const res = {}
    const next = sinon.spy()

    validateRegistrationInviteCookie(req, res, next).should.be.fulfilled.then(error => {
      expect(renderErrorViewSpy.calledWith(req, res, 'Unable to process registration at this time', 404)).to.be.true
      expect(next.called).to.be.false
    }).should.notify(done)
  })
})
