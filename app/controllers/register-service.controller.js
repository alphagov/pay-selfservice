'use strict'

const lodash = require('lodash')

const logger = require('../utils/logger')(__filename)
const paths = require('../paths')
const { renderErrorView } = require('../utils/response')
const serviceService = require('../services/service.service')
const registrationService = require('../services/service-registration.service')
const loginController = require('../controllers/login')
const {
  validatePhoneNumber,
  validateEmail,
  validatePassword,
  validateOtp
} = require('../utils/validation/server-side-form-validations')
const { validateServiceName } = require('../utils/service-name-validation')

const missingSessionErrorMessage = 'Unable to process registration at this time'

const registrationSessionPresent = function registrationSessionPresent (sessionData) {
  return sessionData && sessionData.email && sessionData.code
}

/**
 * Display user registration data entry form
 *
 * @param req
 * @param res
 */
const showRegistration = function showRegistration (req, res) {
  const recovered = lodash.get(req, 'session.pageData.submitRegistration.recovered', {})
  lodash.unset(req, 'session.pageData.submitRegistration.recovered')
  res.render('self-create-service/register', {
    email: recovered.email,
    telephoneNumber: recovered.telephoneNumber,
    errors: recovered.errors
  })
}

/**
 * Process submission of service registration details
 *
 * @param req
 * @param res
 */
const submitRegistration = async function submitRegistration (req, res) {
  const correlationId = req.correlationId
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
    await registrationService.submitRegistration(email, telephoneNumber, password, correlationId)
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
      return renderErrorView(req, res)
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
const showConfirmation = function showConfirmation (req, res) {
  const requesterEmail = lodash.get(req, 'session.pageData.submitRegistration.email', '')
  lodash.unset(req, 'session.pageData.submitRegistration')
  res.render('self-create-service/confirm', {
    requesterEmail
  })
}

/**
 * Display OTP verify page
 *
 * @param req
 * @param res
 */
const showOtpVerify = function showOtpVerify (req, res) {
  const sessionData = req.register_invite
  if (!registrationSessionPresent(sessionData)) {
    return renderErrorView(req, res, missingSessionErrorMessage, 404)
  }
  const recovered = sessionData.recovered || {}
  delete sessionData.recovered

  res.render('self-create-service/verify-otp', {
    errors: recovered.errors
  })
}

/**
 * Orchestration logic
 *
 * @param req
 * @param res
 * @returns {*|Promise|Promise.<T>}
 */
const createPopulatedService = async function createPopulatedService (req, res, next) {
  const sessionData = req.register_invite
  if (!registrationSessionPresent(sessionData)) {
    return renderErrorView(req, res, missingSessionErrorMessage, 404)
  }
  const correlationId = req.correlationId
  const code = req.register_invite.code
  const otpCode = req.body['verify-code']

  const validOtp = validateOtp(otpCode)
  if (!validOtp.valid) {
    sessionData.recovered = {
      errors: {
        verificationCode: validOtp.message
      }
    }
    return res.redirect(303, paths.selfCreateService.otpVerify)
  }

  try {
    await registrationService.submitServiceInviteOtpCode(code, otpCode, correlationId)
  } catch (err) {
    if (err.errorCode === 401) {
      sessionData.recovered = {
        errors: {
          verificationCode: 'The verification code you’ve used is incorrect or has expired'
        }
      }
      return res.redirect(303, paths.selfCreateService.otpVerify)
    } else if (err.errorCode === 410) {
      return renderErrorView(req, res, 'This invitation is no longer valid', 410)
    } else {
      return renderErrorView(req, res, 'Unable to process registration at this time', err.errorCode || 500)
    }
  }

  try {
    const user = await registrationService.createPopulatedService(req.register_invite.code, correlationId)
    loginController.setupDirectLoginAfterRegister(req, res, user.externalId)
    return res.redirect(303, paths.selfCreateService.logUserIn)
  } catch (err) {
    if (err.errorCode === 409) {
      const errorMessage = (err.message && err.message.errors) ? err.message.errors : 'Unable to process registration at this time'
      renderErrorView(req, res, errorMessage, err.errorCode)
    } else {
      renderErrorView(req, res, 'Unable to process registration at this time', err.errorCode || 500)
    }
  }
}

/**
 * Auto-login handler
 *
 * @param req
 * @param res
 */
const loggedIn = function loggedIn (req, res) {
  res.redirect(303, paths.selfCreateService.serviceNaming)
}

/**
 * Display OTP resend page
 *
 * @param req
 * @param res
 */
const showOtpResend = function showOtpResend (req, res) {
  const sessionData = req.register_invite
  if (!registrationSessionPresent(sessionData)) {
    return renderErrorView(req, res, missingSessionErrorMessage, 404)
  }
  res.render('self-create-service/resend-otp', {
    telephoneNumber: sessionData.telephone_number
  })
}

/**
 * Process re-submission of otp verification
 *
 * @param req
 * @param res
 */
const submitOtpResend = async function submitOtpResend (req, res) {
  const sessionData = req.register_invite
  if (!registrationSessionPresent(sessionData)) {
    return renderErrorView(req, res, missingSessionErrorMessage, 404)
  }
  const correlationId = req.correlationId
  const code = sessionData.code
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
    await registrationService.resendOtpCode(code, telephoneNumber, correlationId)
    sessionData.telephone_number = telephoneNumber
    res.redirect(303, paths.selfCreateService.otpVerify)
  } catch (err) {
    logger.warn(`[requestId=${req.correlationId}] Invalid invite code attempted ${req.code}, error = ${err.errorCode}`)
    if (err.errorCode === 404) {
      renderErrorView(req, res, 'Unable to process registration at this time', 404)
    } else {
      renderErrorView(req, res, 'Unable to process registration at this time', 500)
    }
  }
}

/**
 * Display name your service form
 *
 * @param req
 * @param res
 */
const showNameYourService = function showNameYourService (req, res) {
  const serviceName = lodash.get(req, 'session.pageData.submitYourServiceName.serviceName', '')
  lodash.unset(req, 'session.pageData.submitYourServiceName')
  res.render('self-create-service/set-name', {
    serviceName
  })
}

/**
 * Process submission of service name form
 *
 * @param req
 * @param res
 */
const submitYourServiceName = async function submitYourServiceName (req, res) {
  const correlationId = req.correlationId
  const serviceName = req.body['service-name']
  const serviceNameCy = req.body['service-name-cy']
  const validationErrors = validateServiceName(serviceName, 'service-name-en', true)
  const validationErrorsCy = validateServiceName(serviceNameCy, 'service-name-cy', false)

  if (Object.keys(validationErrors).length || Object.keys(validationErrorsCy).length) {
    lodash.set(req, 'session.pageData.submitYourServiceName', {
      errors: validationErrors,
      current_name: lodash.merge({}, { en: serviceName, cy: serviceNameCy })
    })
    res.redirect(303, paths.selfCreateService.serviceNaming)
  } else {
    try {
      await serviceService.updateServiceName(req.user.serviceRoles[0].service.externalId, serviceName, serviceNameCy, correlationId)
      lodash.unset(req, 'session.pageData.submitYourServiceName')
      res.redirect(303, paths.dashboard.index)
    } catch (err) {
      logger.debug(`[requestId=${correlationId}] invalid user input - service name`)
      renderErrorView(req, res, err)
    }
  }
}

module.exports = {
  showRegistration,
  submitRegistration,
  showConfirmation,
  showOtpVerify,
  createPopulatedService,
  loggedIn,
  showOtpResend,
  submitOtpResend,
  showNameYourService,
  submitYourServiceName
}
