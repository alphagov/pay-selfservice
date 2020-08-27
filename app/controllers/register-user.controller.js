'use strict'

const lodash = require('lodash')
const logger = require('../utils/logger')(__filename)
const { renderErrorView, response } = require('../utils/response')
const registrationService = require('../services/user-registration.service')
const paths = require('../paths')
const loginController = require('./login')
const {
  validatePhoneNumber,
  validatePassword,
  validateOtp
} = require('../utils/validation/server-side-form-validations')

// Constants
const messages = {
  missingCookie: 'Unable to process registration at this time',
  internalError: 'Unable to process registration at this time',
  linkExpired: 'This invitation is no longer valid',
}

const handleError = (req, res, err) => {
  logger.warn(`[requestId=${req.correlationId}] Invalid invite code attempted ${req.code}, error = ${err.errorCode}`)

  switch (err.errorCode) {
    case 404:
      renderErrorView(req, res, messages.missingCookie, 404)
      break
    case 410:
      renderErrorView(req, res, messages.linkExpired, 410)
      break
    default:
      renderErrorView(req, res, messages.missingCookie, 500)
  }
}

module.exports = {
  showRegistration: function showRegistration (req, res, next) {
    const sessionData = req.register_invite
    if (!sessionData) {
      return next(new Error('Missing registration session in cookie'))
    }
    const recovered = sessionData.recovered || {}
    delete sessionData.recovered
    const data = {
      email: sessionData.email,
      telephone_number: recovered.telephone_number || sessionData.telephone_number,
      errors: recovered.errors
    }
    response(req, res, 'user-registration/register', data)
  },

  /**
   * subscribe existing user to a service
   * @param req
   * @param res
   */
  subscribeService: (req, res) => {
    const inviteCode = req.register_invite.code
    const correlationId = req.correlationId

    if (!inviteCode) {
      handleError(req, res, { errorCode: 404 })
      return
    }

    return registrationService.completeInvite(inviteCode, correlationId)
      .then(completeResponse => res.redirect(303, `${paths.serviceSwitcher.index}?s=${completeResponse.service_external_id}`))
      .catch(err => handleError(req, res, err))
  },

  /**
   * process submission of user registration details. Issues a OTP for verifying phone
   * @param req
   * @param res
   */
  submitRegistration: async function submitRegistration (req, res, next) {
    const telephoneNumber = req.body['telephone-number']
    const password = req.body['password']
    const correlationId = req.correlationId

    const sessionData = req.register_invite
    if (!sessionData) {
      return next(new Error('Missing registration session in cookie'))
    }

    const errors = {}
    const validPhoneNumber = validatePhoneNumber(telephoneNumber)
    if (!validPhoneNumber.valid) {
      errors.telephoneNumber = validPhoneNumber.message
    }
    const validPassword = validatePassword(password)
    if (!validPassword.valid) {
      errors.password = validPassword.message
    }

    if (!lodash.isEmpty(errors)) {
      sessionData.recovered = {
        telephoneNumber,
        errors
      }
      return res.redirect(paths.registerUser.registration)
    }

    try {
      await registrationService.submitRegistration(sessionData.code, telephoneNumber, password, correlationId)
      req.register_invite.telephone_number = telephoneNumber
      res.redirect(303, paths.registerUser.otpVerify)
    } catch (err) {
      handleError(req, res, err)
    }
  },

  /**
   * display OTP verify page
   * @param req
   * @param res
   */
  showOtpVerify: (req, res, next) => {
    const sessionData = req.register_invite
    if (!sessionData) {
      return next(new Error('Missing registration session in cookie'))
    }
    const recovered = sessionData.recovered || {}
    delete sessionData.recovered
    const data = {
      email: req.register_invite.email,
      errors: recovered.errors
    }
    response(req, res, 'user-registration/verify-otp', data)
  },

  /**
   * verify OTP (thus phone) and completes the registration by creating the user and login user in directly
   * @param req
   * @param res
   */
  submitOtpVerify: async function submitOtpVerify (req, res, next) {
    const correlationId = req.correlationId
    const verificationCode = req.body['verify-code']

    const sessionData = req.register_invite
    if (!sessionData) {
      return next(new Error('Missing registration session in cookie'))
    }

    const validOtp = validateOtp(verificationCode)
    if (!validOtp.valid) {
      sessionData.recovered = {
        errors: {
          verificationCode: validOtp.message
        }
      }
      res.redirect(303, paths.registerUser.otpVerify)
    }

    try {
      const user = await registrationService.verifyOtpAndCreateUser(sessionData.code, verificationCode, correlationId)
      loginController.setupDirectLoginAfterRegister(req, res, user.external_id)
      res.redirect(303, paths.registerUser.logUserIn)
    } catch (err) {
      if (err.errorCode && err.errorCode === 401) {
        sessionData.recovered = {
          errors: {
            verificationCode: 'The verification code you’ve used is incorrect or has expired'
          }
        }
        res.redirect(303, paths.registerUser.otpVerify)
      } else {
        handleError(req, res, err)
      }
    }
  },

  /**
   * display re-verify screen in case if user does not receive a OTP
   * @param req
   * @param res
   */
  showReVerifyPhone: (req, res, next) => {
    const sessionData = req.register_invite
    if (!sessionData) {
      return next(new Error('Missing registration session in cookie'))
    }
    const recovered = sessionData.recovered || {}.recovered
    delete sessionData.recovered

    const data = {
      telephone_number: sessionData.telephone_number,
      errors: recovered.errors
    }
    response(req, res, 'user-registration/re-verify-phone', data)
  },

  /**
   * process submission of re-verify phone. Issues a new OTP and redirects to verify OTP
   * @param req
   * @param res
   */
  submitReVerifyPhone: async function submitReVerifyPhone (req, res, next) {
    const correlationId = req.correlationId
    const telephoneNumber = req.body['telephone-number']

    const sessionData = req.register_invite
    if (!sessionData) {
      return next(new Error('Missing registration session in cookie'))
    }

    const validPhoneNumber = validatePhoneNumber(telephoneNumber)
    if (!validPhoneNumber.valid) {
      sessionData.recovered = {
        telephoneNumber: telephoneNumber,
        errors: {
          telephoneNumber: validPhoneNumber.message
        }
      }
    }

    try {
      await registrationService.resendOtpCode(sessionData.code, telephoneNumber, correlationId)
      sessionData.telephone_number = telephoneNumber
      res.redirect(303, paths.registerUser.otpVerify)
    } catch (err) {
      handleError(req, res, err)
    }
  }
}
