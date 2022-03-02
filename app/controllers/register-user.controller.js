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
const { RegistrationSessionMissingError } = require('../errors')

const EXPIRED_ERROR_MESSAGE = 'This invitation is no longer valid'

const registrationSessionPresent = function registrationSessionPresent (sessionData) {
  return sessionData && sessionData.email && sessionData.code
}

const showRegistration = function showRegistration (req, res, next) {
  const sessionData = req.register_invite
  if (!registrationSessionPresent(sessionData)) {
    return next(new RegistrationSessionMissingError())
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
const subscribeService = async function subscribeService (req, res, next) {
  const sessionData = req.register_invite
  if (!sessionData || !sessionData.code || !sessionData.email) {
    return next(new RegistrationSessionMissingError())
  }

  const inviteCode = sessionData.code
  const correlationId = req.correlationId

  if (sessionData.email !== req.user.email) {
    logger.info('Attempt to accept invite for a different user', {
      invite_code: inviteCode
    })
    return res.redirect(303, paths.serviceSwitcher.index)
  }

  try {
    const completeResponse = await registrationService.completeInvite(inviteCode, correlationId)
    req.flash('inviteSuccessServiceId', completeResponse.service_external_id)
    return res.redirect(303, paths.serviceSwitcher.index)
  } catch (err) {
    if (err.errorCode === 410) {
      renderErrorView(req, res, EXPIRED_ERROR_MESSAGE, 410)
    } else {
      next(err)
    }
  }
}

/**
 * process submission of user registration details. Issues a OTP for verifying phone
 * @param req
 * @param res
 */
const submitRegistration = async function submitRegistration (req, res, next) {
  const telephoneNumber = req.body['telephone-number']
  const password = req.body.password
  const correlationId = req.correlationId

  const sessionData = req.register_invite
  if (!registrationSessionPresent(sessionData)) {
    return next(new RegistrationSessionMissingError())
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
    return res.redirect(303, paths.registerUser.otpVerify)
  } catch (err) {
    if (err.errorCode === 410) {
      renderErrorView(req, res, EXPIRED_ERROR_MESSAGE, 410)
    } else {
      next(err)
    }
  }
}

/**
 * display OTP verify page
 * @param req
 * @param res
 */
const showOtpVerify = function showOtpVerify (req, res, next) {
  const sessionData = req.register_invite
  if (!registrationSessionPresent(sessionData)) {
    return next(new RegistrationSessionMissingError())
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
const submitOtpVerify = async function submitOtpVerify (req, res, next) {
  const correlationId = req.correlationId
  const verificationCode = req.body['verify-code']

  const sessionData = req.register_invite
  if (!registrationSessionPresent(sessionData)) {
    return next(new RegistrationSessionMissingError())
  }

  const validOtp = validateOtp(verificationCode)
  if (!validOtp.valid) {
    sessionData.recovered = {
      errors: {
        verificationCode: validOtp.message
      }
    }
    return res.redirect(303, paths.registerUser.otpVerify)
  }

  try {
    const user = await registrationService.verifyOtpAndCreateUser(sessionData.code, verificationCode, correlationId)
    loginController.setupDirectLoginAfterRegister(req, res, user.external_id)
    return res.redirect(303, paths.registerUser.logUserIn)
  } catch (err) {
    if (err.errorCode === 401) {
      sessionData.recovered = {
        errors: {
          verificationCode: 'The verification code you’ve used is incorrect or has expired'
        }
      }
      res.redirect(303, paths.registerUser.otpVerify)
    } else if (err.errorCode === 410) {
      renderErrorView(req, res, EXPIRED_ERROR_MESSAGE, 410)
    } else {
      next(err)
    }
  }
}

/**
 * display re-verify screen in case if user does not receive a OTP
 * @param req
 * @param res
 */
const showReVerifyPhone = function showReVerifyPhone (req, res, next) {
  const sessionData = req.register_invite
  if (!registrationSessionPresent(sessionData)) {
    return next(new RegistrationSessionMissingError())
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
const submitReVerifyPhone = async function submitReVerifyPhone (req, res, next) {
  const correlationId = req.correlationId
  const telephoneNumber = req.body['telephone-number']

  const sessionData = req.register_invite
  if (!registrationSessionPresent(sessionData)) {
    return next(new RegistrationSessionMissingError())
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
    return res.redirect(303, paths.registerUser.otpVerify)
  } catch (err) {
    if (err.errorCode === 410) {
      renderErrorView(req, res, EXPIRED_ERROR_MESSAGE, 410)
    } else {
      next(err)
    }
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
