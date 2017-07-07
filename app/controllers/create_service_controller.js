'use strict'

// NPM dependencies
const logger = require('winston')
const _ = require('lodash')

// Custom dependencies
const paths = require('../paths')
const response = require('../utils/response')
const errorResponse = response.renderErrorView
const registrationService = require('../services/service_registration_service')
const {validateServiceRegistrationInputs, validateRegistrationTelephoneNumber, validateOtp} = require('../utils/registration_validations')

// Constants
const serviceRegistrationEnabled = process.env.SERVICE_REGISTRATION_ENABLED === 'true'

module.exports = {

  /**
   * Display user registration data entry form
   *
   * @param req
   * @param res
   */
  showRegistration: (req, res) => {
    if (serviceRegistrationEnabled) {
      const email = _.get(req, 'session.pageData.submitRegistration.email', '')
      const telephoneNumber = _.get(req, 'session.pageData.submitRegistration.telephoneNumber', '')
      _.unset(req, 'session.pageData.submitRegistration')
      res.render('self_create_service/register', {
        email,
        telephoneNumber
      })
    } else {
      errorResponse(req, res, 'Invalid route', 404)
    }
  },

  /**
   * Process submission of service registration details
   *
   * @param req
   * @param res
   */
  submitRegistration: (req, res) => {
    const correlationId = req.correlationId
    const email = req.body['email']
    const telephoneNumber = req.body['telephone-number']
    const password = req.body['password']

    const handleServerError = (err) => {
      if ((err.errorCode === 400) ||
        (err.errorCode === 403) ||
        (err.errorCode === 409)) {
        const error = (err.message && err.message.errors) ? err.message.errors : 'Invalid input'
        handleInvalidUserInput(error)
      } else {
        errorResponse(req, res, 'Unable to process registration at this time', err.errorCode)
      }
    }

    const handleInvalidUserInput = (err) => {
      _.set(req, 'session.pageData.submitRegistration', {
        email,
        telephoneNumber
      })
      logger.debug(`[requestId=${correlationId}] invalid user input`)
      req.flash('genericError', err)
      res.redirect(303, paths.selfCreateService.register)
    }

    const handleError = (err) => {
      if (err.errorCode) {
        handleServerError(err)
      } else {
        handleInvalidUserInput(err)
      }
    }

    const proceedToRegistration = () => {
      registrationService.submitRegistration(email, telephoneNumber, password, correlationId)
        .then(() => {
          _.set(req, 'session.pageData.submitRegistration', {
            email,
            telephoneNumber
          })
          res.redirect(303, paths.selfCreateService.confirm)
        }).catch((err) => handleError(err))
    }

    if (serviceRegistrationEnabled) {
      return validateServiceRegistrationInputs(email, telephoneNumber, password)
        .then(proceedToRegistration)
        .catch(
          (err) => handleError(err))
    } else {
      return errorResponse(req, res, 'Invalid route', 404)
    }
  },

  /**
   * Display service creation requested page
   *
   * @param req
   * @param res
   */
  showConfirmation: (req, res) => {
    const requesterEmail = _.get(req, 'session.pageData.submitRegistration.email', '')
    _.unset(req, 'session.pageData.submitRegistration')
    res.render('self_create_service/confirm', {
      requesterEmail
    })
  },

  /**
   * Display OTP verify page
   *
   * @param req
   * @param res
   */
  showOtpVerify: (req, res) => {
    res.render('self_create_service/verify_otp')
  },

  /**
   * Process submission of otp verification
   *
   * @param req
   * @param res
   */
  submitOtpVerify: (req, res) => {
    const correlationId = req.correlationId
    const code = req.register_invite.code
    const otpCode = req.body['verify-code']

    const handleServerError = (err) => {
      logger.warn(`[requestId=${req.correlationId}] Invalid invite code attempted ${req.code}, error = ${err.errorCode}`)
      switch (err.errorCode) {
        case 401:
          handleInvalidOtp('Invalid verification code')
          break
        case 404:
          errorResponse(req, res, 'Unable to process registration at this time', 404)
          break
        case 410:
          errorResponse(req, res, 'This invitation is no longer valid', 410)
          break
        default:
          errorResponse(req, res, 'Unable to process registration at this time', 500)
      }
    }

    const handleInvalidOtp = (message) => {
      logger.debug(`[requestId=${correlationId}] invalid user input - otp code`)
      req.flash('genericError', message)
      res.redirect(303, paths.selfCreateService.otpVerify)
    }

    const handleError = (err) => {
      if (err.errorCode) {
        handleServerError(err)
      } else {
        handleInvalidOtp(err)
      }
    }

    return validateOtp(otpCode)
      .then(() => registrationService.submitServiceInviteOtpCode(code, otpCode, correlationId))
      .then(() => res.send(200))
      .catch(err => handleError(err))
  },

  /**
   * Display OTP resend page
   *
   * @param req
   * @param res
   */
  showOtpResend: (req, res) => {
    res.render('self_create_service/resend_otp', {
      telephoneNumber: req.register_invite.telephone_number
    })
  },

  /**
   * Process re-submission of otp verification
   *
   * @param req
   * @param res
   */
  submitOtpResend: (req, res) => {
    const correlationId = req.correlationId
    const code = req.register_invite.code
    const telephoneNumber = req.body['telephone-number']

    const handleServerError = (err) => {
      logger.warn(`[requestId=${req.correlationId}] Invalid invite code attempted ${req.code}, error = ${err.errorCode}`)
      if (err.errorCode === 404) {
        errorResponse(req, res, 'Unable to process registration at this time', 404)
      } else {
        errorResponse(req, res, 'Unable to process registration at this time', 500)
      }
    }

    const resendOtpAndProceedToVerify = () => {
      registrationService.resendOtpCode(code, telephoneNumber, correlationId)
        .then(() => {
          req.register_invite.telephone_number = telephoneNumber
          res.redirect(303, paths.selfCreateService.otpVerify)
        })
        .catch(err => handleServerError(req, res, err))
    }

    return validateRegistrationTelephoneNumber(telephoneNumber)
      .then(resendOtpAndProceedToVerify)
      .catch(err => {
        logger.debug(`[requestId=${correlationId}] invalid user input - telephone number`)
        req.flash('genericError', err)
        req.register_invite.telephone_number = telephoneNumber
        res.redirect(303, paths.selfCreateService.otpResend)
      })
  },

  /**
   * Display name your service form
   *
   * @param req
   * @param res
   */
  showNameYourService: (req, res) => {
    res.render('self_create_service/set_name')
  }
}
