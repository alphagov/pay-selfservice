'use strict'

const logger = require('../utils/logger')(__filename)
const { renderErrorView, response } = require('../utils/response')
const registrationService = require('../services/user-registration.service')
const paths = require('../paths')
const loginController = require('./login')
const validations = require('../utils/registration-validations')
const shouldProceedWithRegistration = validations.shouldProceedWithRegistration
const validateRegistrationInputs = validations.validateUserRegistrationInputs
const validateRegistrationTelephoneNumber = validations.validateRegistrationTelephoneNumber
const validateOtp = validations.validateOtp

// Constants
const messages = {
  missingCookie: 'Unable to process registration at this time',
  internalError: 'Unable to process registration at this time',
  linkExpired: 'This invitation is no longer valid',
  invalidOtp: 'Invalid verification code'
}

const withValidatedRegistrationCookie = (req, res, next) => {
  const correlationId = req.correlationId
  return shouldProceedWithRegistration(req.register_invite)
    .then(next)
    .catch(err => {
      logger.warn(`[requestId=${correlationId}] unable to validate required cookie for registration - ${err.message}`)
      renderErrorView(req, res, messages.missingCookie, 404)
    })
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

  /**
   * display user registration data entry form.
   * @param req
   * @param res
   */
  showRegistration: (req, res) => {
    const renderRegistrationPage = () => {
      const data = {
        email: req.register_invite.email
      }
      if (req.register_invite.telephone_number) {
        data.telephone_number = req.register_invite.telephone_number
      }
      response(req, res, 'user_registration/register', data)
    }

    return withValidatedRegistrationCookie(req, res, renderRegistrationPage)
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
  submitRegistration: (req, res) => {
    const telephoneNumber = req.body['telephone-number']
    const password = req.body['password']
    const correlationId = req.correlationId
    const code = req.register_invite.code

    const proceedToVerification = () => {
      registrationService.submitRegistration(code, telephoneNumber, password, correlationId)
        .then(() => {
          req.register_invite.telephone_number = telephoneNumber
          res.redirect(303, paths.registerUser.otpVerify)
        })
        .catch((err) => handleError(req, res, err))
    }

    const redirectToDetailEntry = (err) => {
      req.register_invite.telephone_number = telephoneNumber
      req.flash('genericError', err.message)
      res.redirect(303, paths.registerUser.registration)
    }

    return withValidatedRegistrationCookie(req, res, () => {
      validateRegistrationInputs(telephoneNumber, password)
        .then(proceedToVerification)
        .catch(redirectToDetailEntry)
    })
  },

  /**
   * display OTP verify page
   * @param req
   * @param res
   */
  showOtpVerify: (req, res) => {
    const data = {
      email: req.register_invite.email
    }

    const displayVerifyCodePage = () => {
      response(req, res, 'user_registration/verify_otp', data)
    }

    return withValidatedRegistrationCookie(req, res, displayVerifyCodePage)
  },

  /**
   * verify OTP (thus phone) and completes the registration by creating the user and login user in directly
   * @param req
   * @param res
   */
  submitOtpVerify: (req, res) => {
    const correlationId = req.correlationId
    const verificationCode = req.body['verify-code']
    const code = req.register_invite.code

    const redirectToAutoLogin = (req, res) => {
      res.redirect(303, paths.registerUser.logUserIn)
    }

    const handleInvalidOtp = (message) => {
      logger.debug(`[requestId=${correlationId}] invalid user input - otp code`)
      req.flash('genericError', message)
      res.redirect(303, paths.registerUser.otpVerify)
    }

    const verifyOtpAndCreateUser = function () {
      registrationService.verifyOtpAndCreateUser(code, verificationCode, correlationId)
        .then((user) => {
          loginController.setupDirectLoginAfterRegister(req, res, user.external_id)
          redirectToAutoLogin(req, res)
        })
        .catch(err => {
          if (err.errorCode && err.errorCode === 401) {
            handleInvalidOtp(messages.invalidOtp)
          } else {
            handleError(req, res, err)
          }
        })
    }

    return withValidatedRegistrationCookie(req, res, () => {
      validateOtp(verificationCode)
        .then(verifyOtpAndCreateUser)
        .catch(err => handleInvalidOtp(err.message))
    })
  },

  /**
   * display re-verify screen in case if user does not receive a OTP
   * @param req
   * @param res
   */
  showReVerifyPhone: (req, res) => {
    const telephoneNumber = req.register_invite.telephone_number

    const displayReVerifyCodePage = () => {
      const data = {
        telephone_number: telephoneNumber
      }
      response(req, res, 'user_registration/re_verify_phone', data)
    }

    return withValidatedRegistrationCookie(req, res, displayReVerifyCodePage)
  },

  /**
   * process submission of re-verify phone. Issues a new OTP and redirects to verify OTP
   * @param req
   * @param res
   */
  submitReVerifyPhone: (req, res) => {
    const correlationId = req.correlationId
    const code = req.register_invite.code
    const telephoneNumber = req.body['telephone-number']

    const resendOtpAndProceedToVerify = () => {
      registrationService.resendOtpCode(code, telephoneNumber, correlationId)
        .then(() => {
          req.register_invite.telephone_number = telephoneNumber
          res.redirect(303, paths.registerUser.otpVerify)
        })
        .catch(err => handleError(req, res, err))
    }

    return withValidatedRegistrationCookie(req, res, () => {
      validateRegistrationTelephoneNumber(telephoneNumber)
        .then(resendOtpAndProceedToVerify)
        .catch(err => {
          logger.debug(`[requestId=${correlationId}] invalid user input - telephone number`)
          req.flash('genericError', err.message)
          req.register_invite.telephone_number = telephoneNumber
          res.redirect(303, paths.registerUser.reVerifyPhone)
        })
    })
  }

}
