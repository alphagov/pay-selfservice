'use strict'

// NPM dependencies)
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const q = require('q')

// Custom dependencies
const paths = require('../../../app/paths')

// Constants
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

describe('otp_verify middleware', function () {

  const winstonDebugSpy = sinon.spy()
  const winstonWarnSpy = sinon.spy()
  const renderErrorViewSpy = sinon.spy()
  const submitServiceInviteOtpCodeSpy = sinon.spy()
  const reqFlashSpy = sinon.spy()
  const resRedirectSpy = sinon.spy()

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
      'winston': {
        debug: winstonDebugSpy,
        warn: winstonWarnSpy
      },
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
    winstonDebugSpy.reset()
    winstonWarnSpy.reset()
    renderErrorViewSpy.reset()
    submitServiceInviteOtpCodeSpy.reset()
    reqFlashSpy.reset()
    resRedirectSpy.reset()
  })

  it('should call next on valid otp code', function (done) {
    const next = sinon.spy()

    otpVerify.verifyOtpForServiceInvite(req, res, next).should.be.fulfilled.then(result => {
      expect(next.called).to.be.true
    }).should.notify(done)
  })

  it('should handle invalid otp validation', function (done) {
    req.body['verify-code'] = 'invalid-otp'
    const next = sinon.spy()

    otpVerify.verifyOtpForServiceInvite(req, res, next).should.be.fulfilled.then(result => {
      expect(winstonDebugSpy.calledWith(`[requestId=${req.correlationId}] invalid user input - otp code`)).to.equal(true)
      expect(reqFlashSpy.calledWith('genericError', 'Invalid verification code')).to.equal(true)
      expect(resRedirectSpy.calledWith(303, paths.selfCreateService.otpVerify)).to.equal(true)
      expect(next.called).to.be.false
    }).should.notify(done)
  })

  it('should handle 401 server error', function (done) {
    proxyquireObject['../services/service_registration_service'].submitServiceInviteOtpCode = function (code, otpCode, correlationId) {
      const defer = q.defer()
      defer.reject({
        errorCode: 401
      })
      return defer.promise
    }
    otpVerify = proxyquire('../../../app/middleware/otp_verify', proxyquireObject)
    const next = sinon.spy()

    otpVerify.verifyOtpForServiceInvite(req, res, next).should.be.fulfilled.then(result => {
      expect(winstonDebugSpy.calledWith(`[requestId=${req.correlationId}] invalid user input - otp code`)).to.equal(true)
      expect(reqFlashSpy.calledWith('genericError', 'Invalid verification code')).to.equal(true)
      expect(resRedirectSpy.calledWith(303, paths.selfCreateService.otpVerify)).to.equal(true)
      expect(next.called).to.be.false
    }).should.notify(done)
  })

  it('should handle 404 server error', function (done) {
    proxyquireObject['../services/service_registration_service'].submitServiceInviteOtpCode = function (code, otpCode, correlationId) {
      const defer = q.defer()
      defer.reject({
        errorCode: 404
      })
      return defer.promise
    }
    otpVerify = proxyquire('../../../app/middleware/otp_verify', proxyquireObject)
    const next = sinon.spy()

    otpVerify.verifyOtpForServiceInvite(req, res, next).should.be.fulfilled.then(result => {
      expect(renderErrorViewSpy.calledWith(req, res, 'Unable to process registration at this time', 404)).to.equal(true)
      expect(next.called).to.be.false
    }).should.notify(done)
  })

  it('should handle 410 server error', function (done) {
    proxyquireObject['../services/service_registration_service'].submitServiceInviteOtpCode = function (code, otpCode, correlationId) {
      const defer = q.defer()
      defer.reject({
        errorCode: 410
      })
      return defer.promise
    }
    otpVerify = proxyquire('../../../app/middleware/otp_verify', proxyquireObject)
    const next = sinon.spy()

    otpVerify.verifyOtpForServiceInvite(req, res, next).should.be.fulfilled.then(result => {
      expect(renderErrorViewSpy.calledWith(req, res, 'This invitation is no longer valid', 410)).to.equal(true)
      expect(next.called).to.be.false
    }).should.notify(done)
  })

  it('should handle 500 server error', function (done) {
    proxyquireObject['../services/service_registration_service'].submitServiceInviteOtpCode = function (code, otpCode, correlationId) {
      const defer = q.defer()
      defer.reject({
        errorCode: 500
      })
      return defer.promise
    }
    otpVerify = proxyquire('../../../app/middleware/otp_verify', proxyquireObject)
    const next = sinon.spy()

    otpVerify.verifyOtpForServiceInvite(req, res, next).should.be.fulfilled.then(result => {
      expect(renderErrorViewSpy.calledWith(req, res, 'Unable to process registration at this time', 500)).to.equal(true)
      expect(next.called).to.be.false
    }).should.notify(done)
  })
})
