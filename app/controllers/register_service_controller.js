'use strict'

// NPM dependencies
const logger = require('winston')
const _ = require('lodash')

// Custom dependencies
const paths = require('../paths')
const response = require('../utils/response')
const errorResponse = response.renderErrorView
const serviceService = require('../services/service_service')
const registrationService = require('../services/service_registration_service')
const loginController = require('../controllers/login_controller')
const {validateServiceRegistrationInputs, validateRegistrationTelephoneNumber, validateServiceNamingInputs} = require('../utils/registration_validations')

module.exports = {

  /**
   * Display user registration data entry form
   *
   * @param req
   * @param res
   */
  showRegistration: (req, res) => {
    const email = _.get(req, 'session.pageData.submitRegistration.email', '')
    const telephoneNumber = _.get(req, 'session.pageData.submitRegistration.telephoneNumber', '')
    _.unset(req, 'session.pageData.submitRegistration')
    res.render('self_create_service/register', {
      email,
      telephoneNumber
    })
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
    const telephoneNumber = req.body['telephone-number'].replace(/\s/g, '')
    const password = req.body['password']

    const handleServerError = (err) => {
      if ((err.errorCode === 400) || (err.errorCode === 403)) {
        const error = (err.message && err.message.errors) ? err.message.errors : 'Invalid input'
        handleInvalidUserInput(error)
      } else if (err.errorCode === 409) {
        // we should redirect in all cases regardless whether the user exists, disabled or new
        _.set(req, 'session.pageData.submitRegistration', {
          email,
          telephoneNumber
        })
        res.redirect(303, paths.selfCreateService.confirm)
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

    return validateServiceRegistrationInputs(email, telephoneNumber, password)
      .then(proceedToRegistration)
      .catch(err => handleError(err))
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
   * Orchestration logic
   *
   * @param req
   * @param res
   * @returns {*|Promise|Promise.<T>}
   */
  createPopulatedService: (req, res) => {
    const correlationId = req.correlationId

    return registrationService.createPopulatedService(req.register_invite.code, correlationId)
      .then(completeServiceInviteResponse => {
        loginController.setupDirectLoginAfterRegister(req, res, completeServiceInviteResponse.user_external_id)
        res.redirect(303, paths.selfCreateService.logUserIn)
      })
      .catch(err => {
        if (err.errorCode === 409) {
          const error = (err.message && err.message.errors) ? err.message.errors : 'Unable to process registration at this time'
          errorResponse(req, res, error, err.errorCode)
        } else {
          errorResponse(req, res, 'Unable to process registration at this time', err.errorCode || 500)
        }
      })
  },

  /**
   * Auto-login handler
   *
   * @param req
   * @param res
   */
  loggedIn: (req, res) => {
    res.redirect(303, paths.selfCreateService.serviceNaming)
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

    const resendOtpAndProceedToVerify = () => {
      registrationService.resendOtpCode(code, telephoneNumber, correlationId)
        .then(() => {
          req.register_invite.telephone_number = telephoneNumber
          res.redirect(303, paths.selfCreateService.otpVerify)
        })
        .catch(err => {
          logger.warn(`[requestId=${req.correlationId}] Invalid invite code attempted ${req.code}, error = ${err.errorCode}`)
          if (err.errorCode === 404) {
            errorResponse(req, res, 'Unable to process registration at this time', 404)
          } else {
            errorResponse(req, res, 'Unable to process registration at this time', 500)
          }
        })
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
    const serviceName = _.get(req, 'session.pageData.submitYourServiceName.serviceName', '')
    _.unset(req, 'session.pageData.submitYourServiceName')
    res.render('self_create_service/set_name', {
      serviceName
    })
  },

  /**
   * Process submission of service name form
   *
   * @param req
   * @param res
   */
  submitYourServiceName: (req, res) => {
    const correlationId = req.correlationId
    const serviceName = req.body['service-name']

    _.set(req, 'session.pageData.submitYourServiceName', {
      serviceName
    })

    return validateServiceNamingInputs(serviceName)
      .then(() => {
        return serviceService.updateServiceName(req.user.serviceRoles[0].service.externalId, serviceName, correlationId)
      })
      .then((updatedService) => {
        _.unset(req, 'session.pageData.submitYourServiceName')
        res.redirect(303, paths.user.loggedIn)
      })
      .catch(err => {
        logger.debug(`[requestId=${correlationId}] invalid user input - service name`)
        req.flash('genericError', err)
        res.redirect(303, paths.selfCreateService.serviceNaming)
      })
  }
}
