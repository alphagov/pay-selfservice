'use strict'

// NPM dependencies)
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const proxyquire = require('proxyquire')
const sinon = require('sinon')

// Custom dependencies
const paths = require('../../../app/paths')

// Constants
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

describe('otp_verify middleware', function () {
  let renderErrorViewSpy = sinon.spy()
  let submitServiceInviteOtpCodeSpy = sinon.spy()
  let reqFlashSpy = sinon.spy()
  let resRedirectSpy = sinon.spy()

  let proxyquireObject, otpVerify
  let req, res

  beforeEach(() => {
    req = {
      correlationId: 'a-correlationId',
      register_invite: {
        code: 'a-code',
        email: 'a-user@gov.uk'
      },
      body: {
        email: 'user@gov.uk',
        'telephone-number': '07451234567',
        password: 'password1234',
        'verify-code': '123456'
      },
      flash: reqFlashSpy
    }
    res = {
      redirect: resRedirectSpy
    }

    proxyquireObject = {
      '../utils/response': {
        renderErrorView: renderErrorViewSpy
      },
      '../services/service_registration_service': {
        submitServiceInviteOtpCode: submitServiceInviteOtpCodeSpy
      }
    }
    otpVerify = proxyquire('../../../app/middleware/otp_verify', proxyquireObject)
  })

  afterEach(() => {
    renderErrorViewSpy = sinon.spy()
    submitServiceInviteOtpCodeSpy = sinon.spy()
    reqFlashSpy = sinon.spy()
    resRedirectSpy = sinon.spy()
  })

  it('should call next on valid otp code', function (done) {
    const next = sinon.spy()

    otpVerify.verifyOtpForServiceInvite(req, res, next).should.be.fulfilled.then(result => {
      expect(next.called).to.be.true // eslint-disable-line
    }).should.notify(done)
  })

  it('should handle invalid otp validation', function (done) {
    req.body['verify-code'] = 'invalid-otp'
    const next = sinon.spy()

    otpVerify.verifyOtpForServiceInvite(req, res, next).should.be.fulfilled.then(result => {
      expect(reqFlashSpy.calledWith('genericError', 'Invalid verification code')).to.equal(true)
      expect(resRedirectSpy.calledWith(303, paths.selfCreateService.otpVerify)).to.equal(true)
      expect(next.called).to.be.false // eslint-disable-line
    }).should.notify(done)
  })

  it('should handle 401 server error', function (done) {
    proxyquireObject['../services/service_registration_service'].submitServiceInviteOtpCode = function (code, otpCode, correlationId) {
      return Promise.reject({ errorCode: 401 }) // eslint-disable-line
    }
    otpVerify = proxyquire('../../../app/middleware/otp_verify', proxyquireObject)
    const next = sinon.spy()

    otpVerify.verifyOtpForServiceInvite(req, res, next).should.be.fulfilled.then(result => {
      expect(reqFlashSpy.calledWith('genericError', 'Invalid verification code')).to.equal(true)
      expect(resRedirectSpy.calledWith(303, paths.selfCreateService.otpVerify)).to.equal(true)
      expect(next.called).to.be.false // eslint-disable-line
    }).should.notify(done)
  })

  it('should handle 404 server error', function (done) {
    proxyquireObject['../services/service_registration_service'].submitServiceInviteOtpCode = function (code, otpCode, correlationId) {
      return Promise.reject({ errorCode: 404 }) // eslint-disable-line
    }
    otpVerify = proxyquire('../../../app/middleware/otp_verify', proxyquireObject)
    const next = sinon.spy()

    otpVerify.verifyOtpForServiceInvite(req, res, next).should.be.fulfilled.then(result => {
      expect(renderErrorViewSpy.calledWith(req, res, 'Unable to process registration at this time', 404)).to.equal(true)
      expect(next.called).to.be.false // eslint-disable-line
    }).should.notify(done)
  })

  it('should handle 410 server error', function (done) {
    proxyquireObject['../services/service_registration_service'].submitServiceInviteOtpCode = function (code, otpCode, correlationId) {
      return Promise.reject({ errorCode: 410 }) // eslint-disable-line
    }
    otpVerify = proxyquire('../../../app/middleware/otp_verify', proxyquireObject)
    const next = sinon.spy()

    otpVerify.verifyOtpForServiceInvite(req, res, next).should.be.fulfilled.then(result => {
      expect(renderErrorViewSpy.calledWith(req, res, 'This invitation is no longer valid', 410)).to.equal(true)
      expect(next.called).to.be.false // eslint-disable-line
    }).should.notify(done)
  })

  it('should handle 500 server error', function (done) {
    proxyquireObject['../services/service_registration_service'].submitServiceInviteOtpCode = function (code, otpCode, correlationId) {
      return Promise.reject({ errorCode: 500 }) // eslint-disable-line
    }
    otpVerify = proxyquire('../../../app/middleware/otp_verify', proxyquireObject)
    const next = sinon.spy()

    otpVerify.verifyOtpForServiceInvite(req, res, next).should.be.fulfilled.then(result => {
      expect(renderErrorViewSpy.calledWith(req, res, 'Unable to process registration at this time', 500)).to.equal(true)
      expect(next.called).to.be.false // eslint-disable-line
    }).should.notify(done)
  })
})
