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
  linkExpired: 'This invitation is no longer valid'
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

const registrationSessionPresent = function registrationSessionPresent (sessionData) {
  return sessionData && sessionData.email && sessionData.code
}

const showRegistration = function showRegistration (req, res) {
  const sessionData = req.register_invite
  if (!registrationSessionPresent(sessionData)) {
    return renderErrorView(req, res, messages.missingCookie, 404)
  }
  const recovered = sessionData.recovered || {}
  delete sessionData.recovered
  const data = {
    email: sessionData.email,
    telephone_number: recovered.telephoneNumber || sessionData.telephone_number,
    errors: recovered.errors
  }
  response(req, res, 'user-registration/register', data)
}

/**
 * subscribe existing user to a service
 * @param req
 * @param res
 */
const subscribeService = async function subscribeService (req, res) {
  const sessionData = req.register_invite
  if (!sessionData || !sessionData.code) {
    return renderErrorView(req, res, messages.missingCookie, 404)
  }

  const inviteCode = sessionData.code
  const correlationId = req.correlationId

  try {
    const completeResponse = await registrationService.completeInvite(inviteCode, correlationId)
    return res.redirect(303, `${paths.serviceSwitcher.index}?s=${completeResponse.service_external_id}`)
  } catch (err) {
    handleError(req, res, err)
  }
}

/**
 * process submission of user registration details. Issues a OTP for verifying phone
 * @param req
 * @param res
 */
const submitRegistration = async function submitRegistration (req, res) {
  const telephoneNumber = req.body['telephone-number']
  const password = req.body['password']
  const correlationId = req.correlationId

  const sessionData = req.register_invite
  if (!registrationSessionPresent(sessionData)) {
    return renderErrorView(req, res, messages.missingCookie, 404)
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
    return res.redirect(303, paths.registerUser.registration)
  }

  try {
    await registrationService.submitRegistration(sessionData.code, telephoneNumber, password, correlationId)
    sessionData.telephone_number = telephoneNumber
    res.redirect(303, paths.registerUser.otpVerify)
  } catch (err) {
    handleError(req, res, err)
  }
}

/**
 * display OTP verify page
 * @param req
 * @param res
 */
const showOtpVerify = function showOtpVerify (req, res) {
  const sessionData = req.register_invite
  if (!registrationSessionPresent(sessionData)) {
    return renderErrorView(req, res, messages.missingCookie, 404)
  }
  const recovered = sessionData.recovered || {}
  delete sessionData.recovered
  const data = {
    email: sessionData.email,
    errors: recovered.errors
  }
  response(req, res, 'user-registration/verify-otp', data)
}

/**
 * verify OTP (thus phone) and completes the registration by creating the user and login user in directly
 * @param req
 * @param res
 */
const submitOtpVerify = async function submitOtpVerify (req, res) {
  const correlationId = req.correlationId
  const verificationCode = req.body['verify-code']

  const sessionData = req.register_invite
  if (!registrationSessionPresent(sessionData)) {
    return renderErrorView(req, res, messages.missingCookie, 404)
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
}

/**
 * display re-verify screen in case if user does not receive a OTP
 * @param req
 * @param res
 */
const showReVerifyPhone = function showReVerifyPhone (req, res) {
  const sessionData = req.register_invite
  if (!registrationSessionPresent(sessionData)) {
    return renderErrorView(req, res, messages.missingCookie, 404)
  }
  const recovered = sessionData.recovered || {}
  delete sessionData.recovered

  const data = {
    telephone_number: recovered.telephoneNumber || sessionData.telephone_number,
    errors: recovered.errors
  }
  response(req, res, 'user-registration/re-verify-phone', data)
}

/**
 * process submission of re-verify phone. Issues a new OTP and redirects to verify OTP
 * @param req
 * @param res
 */
const submitReVerifyPhone = async function submitReVerifyPhone (req, res) {
  const correlationId = req.correlationId
  const telephoneNumber = req.body['telephone-number']

  const sessionData = req.register_invite
  if (!registrationSessionPresent(sessionData)) {
    return renderErrorView(req, res, messages.missingCookie, 404)
  }

  const validPhoneNumber = validatePhoneNumber(telephoneNumber)
  if (!validPhoneNumber.valid) {
    sessionData.recovered = {
      telephoneNumber: telephoneNumber,
      errors: {
        telephoneNumber: validPhoneNumber.message
      }
    }
    return res.redirect(303, paths.registerUser.reVerifyPhone)
  }

  try {
    await registrationService.resendOtpCode(sessionData.code, telephoneNumber, correlationId)
    sessionData.telephone_number = telephoneNumber
    res.redirect(303, paths.registerUser.otpVerify)
  } catch (err) {
    handleError(req, res, err)
  }
}

module.exports = {
  showRegistration,
  subscribeService,
  submitRegistration,
  showOtpVerify,
  submitOtpVerify,
  showReVerifyPhone,
  submitReVerifyPhone
}
