'use strict'

const lodash = require('lodash')

const logger = require('../utils/logger')(__filename)
const paths = require('../paths')
const { renderErrorView } = require('../utils/response')
const serviceService = require('../services/service.service')
const { ConnectorClient } = require('../services/clients/connector.client')
const formatAccountPathsFor = require('../utils/format-account-paths-for')
const registrationService = require('../services/service-registration.service')
const validateInviteService = require('../services/validate-invite.service')
const loginController = require('../controllers/login')
const {
  validatePhoneNumber,
  validateEmail,
  validatePassword,
  validateOtp,
  validateMandatoryField,
  SERVICE_NAME_MAX_LENGTH
} = require('../utils/validation/server-side-form-validations')
const { RegistrationSessionMissingError, InvalidRegistationStateError } = require('../errors')
const { DEFAULT_SERVICE_NAME } = require('../utils/constants')

const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)

const EXPIRED_ERROR_MESSAGE = 'This invitation is no longer valid'
const INVITE_NOT_FOUND_ERROR_MESSAGE = 'There has been a problem proceeding with this registration. Please try again.'

function registrationSessionPresent (sessionData) {
  return sessionData && sessionData.email && sessionData.code
}

function getServiceCreatedDuringSignup (user) {
  return user.serviceRoles.map(serviceRole => serviceRole.service)
    .find(service => service.serviceName && service.serviceName.en === DEFAULT_SERVICE_NAME)
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
  const correlationId = req.correlationId

  const sessionData = req.register_invite
  if (!registrationSessionPresent(sessionData)) {
    return next(new RegistrationSessionMissingError())
  }

  const recovered = sessionData.recovered || {}
  delete sessionData.recovered

  try {
    const invite = await validateInviteService.getValidatedInvite(sessionData.code, correlationId)

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

async function createPopulatedService (req, res, next) {
  const sessionData = req.register_invite
  if (!registrationSessionPresent(sessionData)) {
    return next(new RegistrationSessionMissingError())
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
      return next(err)
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
      next(err)
    }
  }
}

/**
 * Auto-login handler
 *
 * @param req
 * @param res
 */
function loggedIn (req, res) {
  res.redirect(303, paths.selfCreateService.serviceNaming)
}

/**
 * Display OTP resend page
 *
 * @param req
 * @param res
 */
async function showOtpResend (req, res, next) {
  const correlationId = req.correlationId

  const sessionData = req.register_invite
  if (!registrationSessionPresent(sessionData)) {
    return next(new RegistrationSessionMissingError())
  }

  try {
    const invite = await validateInviteService.getValidatedInvite(sessionData.code, correlationId)

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
  const correlationId = req.correlationId
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
    await registrationService.resendOtpCode(sessionData.code, telephoneNumber, correlationId)
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

function showNameYourService (req, res) {
  const pageData = lodash.get(req, 'session.pageData.submitYourServiceName', {})
  lodash.unset(req, 'session.pageData.submitYourServiceName')
  if (!getServiceCreatedDuringSignup(req.user)) {
    logger.warn('User attempted to access the page to set the service name as part of registration but no service with the default name was found')
    return res.redirect(303, paths.serviceSwitcher.index)
  }
  res.render('self-create-service/set-name', pageData)
}

async function submitYourServiceName (req, res, next) {
  const correlationId = req.correlationId
  const serviceName = req.body['service-name']

  const nameValidationResult = validateMandatoryField(serviceName, SERVICE_NAME_MAX_LENGTH, 'service name')
  if (!nameValidationResult.valid) {
    lodash.set(req, 'session.pageData.submitYourServiceName', {
      errors: {
        service_name: nameValidationResult.message
      },
      serviceName
    })
    res.redirect(303, paths.selfCreateService.serviceNaming)
  } else {
    try {
      const service = getServiceCreatedDuringSignup(req.user)
      if (!service) {
        throw new Error(`Attempting to set name for service during registration but a service with name "${DEFAULT_SERVICE_NAME}" was not found`)
      }
      const account = await connectorClient.getAccount({ gatewayAccountId: service.gatewayAccountIds[0] })
      await serviceService.updateServiceName(service.externalId, serviceName, null, correlationId)
      res.redirect(303, formatAccountPathsFor(paths.account.dashboard.index, account.external_id))
    } catch (err) {
      next(err)
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
