'use strict'

const lodash = require('lodash')

const logger = require('../utils/logger')(__filename)
const paths = require('../paths')
const { renderErrorView } = require('../utils/response')
const registrationService = require('../services/service-registration.service')
const validateInviteService = require('../services/validate-invite.service')
const loginController = require('../controllers/login')
const {
  validatePhoneNumber,
  validateEmail,
  validatePassword,
  validateOtp
} = require('../utils/validation/server-side-form-validations')
const { RegistrationSessionMissingError, InvalidRegistationStateError } = require('../errors')
const { validationErrors } = require('../utils/validation/field-validation-checks')

const EXPIRED_ERROR_MESSAGE = 'This invitation is no longer valid'
const INVITE_NOT_FOUND_ERROR_MESSAGE = 'There has been a problem proceeding with this registration. Please try again.'

function registrationSessionPresent (sessionData) {
  return sessionData && sessionData.email && sessionData.code
}

function showRegistration (req, res) {
  const recovered = lodash.get(req, 'session.pageData.submitRegistration.recovered', {})
  lodash.unset(req, 'session.pageData.submitRegistration.recovered')
  res.render('self-create-service/register', {
    email: recovered.email,
    telephoneNumber: recovered.telephoneNumber,
    errors: recovered.errors
  })
}

async function submitRegistration (req, res, next) {
  const email = req.body['email']
  const telephoneNumber = req.body['telephone-number']
  const password = req.body['password']

  const errors = {}
  const validEmail = validateEmail(email)
  if (!validEmail.valid) {
    errors.email = validEmail.message
  }
  const validPhoneNumber = validatePhoneNumber(telephoneNumber)
  if (!validPhoneNumber.valid) {
    errors.telephoneNumber = validPhoneNumber.message
  }
  const validPassword = validatePassword(password)
  if (!validPassword.valid) {
    errors.password = validPassword.message
  }

  if (!lodash.isEmpty(errors)) {
    lodash.set(req, 'session.pageData.submitRegistration.recovered', {
      email,
      telephoneNumber,
      errors
    })
    return res.redirect(303, paths.selfCreateService.register)
  }

  try {
    await registrationService.submitRegistration(email, telephoneNumber, password)
  } catch (err) {
    if (err.errorCode === 403) {
      // 403 from adminusers indicates that this is not a public sector email
      lodash.set(req, 'session.pageData.submitRegistration.recovered', {
        email,
        telephoneNumber,
        errors: {
          email: 'Enter a public sector email address'
        }
      })
      return res.redirect(303, paths.selfCreateService.register)
    } else if (err.errorCode !== 409) {
      // Adminusers bizarrely returns a 409 when a user already exists, but sends them an email
      // to tell them this. We continue to the next page if this is the case as it will
      // tell them to check their email.
      lodash.unset(req, 'session.pageData.submitRegistration')
      return next(err)
    }
  }

  lodash.set(req, 'session.pageData.submitRegistration', {
    email,
    telephoneNumber
  })
  res.redirect(303, paths.selfCreateService.confirm)
}

/**
 * Display service creation requested page
 *
 * @param req
 * @param res
 */
function showConfirmation (req, res) {
  const requesterEmail = lodash.get(req, 'session.pageData.submitRegistration.email', '')
  lodash.unset(req, 'session.pageData.submitRegistration')
  res.render('self-create-service/confirm', {
    requesterEmail
  })
}

async function showOtpVerify (req, res, next) {
  const sessionData = req.register_invite
  if (!registrationSessionPresent(sessionData)) {
    return next(new RegistrationSessionMissingError())
  }

  const recovered = sessionData.recovered || {}
  delete sessionData.recovered

  try {
    const invite = await validateInviteService.getValidatedInvite(sessionData.code)

    if (!invite.password_set) {
      return next(new InvalidRegistationStateError())
    }

    res.render('self-create-service/verify-otp', {
      errors: recovered.errors
    })
  } catch (err) {
    switch (err.errorCode) {
      case 404:
        renderErrorView(req, res, INVITE_NOT_FOUND_ERROR_MESSAGE, 404)
        break
      case 410:
        renderErrorView(req, res, EXPIRED_ERROR_MESSAGE, 410)
        break
      default:
        next(err)
    }
  }
}

async function submitOtpCode (req, res, next) {
  const sessionData = req.register_invite
  if (!registrationSessionPresent(sessionData)) {
    return next(new RegistrationSessionMissingError())
  }
  const code = req.register_invite.code
  const otpCode = req.body['verify-code']

  const validOtp = validateOtp(otpCode)
  if (!validOtp.valid) {
    sessionData.recovered = {
      errors: {
        securityCode: validOtp.message
      }
    }
    return res.redirect(303, paths.selfCreateService.otpVerify)
  }

  try {
    await registrationService.submitServiceInviteOtpCode(code, otpCode)
  } catch (err) {
    if (err.errorCode === 401) {
      sessionData.recovered = {
        errors: {
          securityCode: validationErrors.invalidOrExpiredSecurityCodeSMS
        }
      }
      return res.redirect(303, paths.selfCreateService.otpVerify)
    } else if (err.errorCode === 410) {
      return renderErrorView(req, res, 'This invitation is no longer valid', 410)
    } else {
      return next(err)
    }
  }

  try {
    const userExternalId = await registrationService.completeInvite(req.register_invite.code)
    loginController.setupDirectLoginAfterRegister(req, res, userExternalId)
    return res.redirect(303, paths.registerUser.logUserIn)
  } catch (err) {
    next(err)
  }
}

/**
 * Display OTP resend page
 *
 * @param req
 * @param res
 */
async function showOtpResend (req, res, next) {
  const sessionData = req.register_invite
  if (!registrationSessionPresent(sessionData)) {
    return next(new RegistrationSessionMissingError())
  }

  try {
    const invite = await validateInviteService.getValidatedInvite(sessionData.code)

    if (!invite.password_set) {
      return next(new InvalidRegistationStateError())
    }

    res.render('self-create-service/resend-otp', {
      telephoneNumber: sessionData.telephone_number
    })
  } catch (err) {
    switch (err.errorCode) {
      case 404:
        renderErrorView(req, res, INVITE_NOT_FOUND_ERROR_MESSAGE, 404)
        break
      case 410:
        renderErrorView(req, res, EXPIRED_ERROR_MESSAGE, 410)
        break
      default:
        next(err)
    }
  }
}

/**
 * Process re-submission of otp verification
 *
 * @param req
 * @param res
 */
async function submitOtpResend (req, res, next) {
  const sessionData = req.register_invite
  if (!registrationSessionPresent(sessionData)) {
    return next(new RegistrationSessionMissingError())
  }
  const telephoneNumber = req.body['telephone-number']

  const validPhoneNumber = validatePhoneNumber(telephoneNumber)
  if (!validPhoneNumber.valid) {
    res.render('self-create-service/resend-otp', {
      telephoneNumber,
      errors: {
        telephoneNumber: validPhoneNumber.message
      }
    })
  }

  try {
    await registrationService.resendOtpCode(sessionData.code, telephoneNumber)
    sessionData.telephone_number = telephoneNumber
    res.redirect(303, paths.selfCreateService.otpVerify)
  } catch (err) {
    logger.warn(`Invalid invite code attempted ${req.code}, error = ${err.errorCode}`)
    if (err.errorCode === 404) {
      renderErrorView(req, res, 'Unable to process registration at this time', 404)
    } else {
      next(err)
    }
  }
}

module.exports = {
  showRegistration,
  submitRegistration,
  showConfirmation,
  showOtpVerify,
  submitOtpCode,
  showOtpResend,
  submitOtpResend
}
