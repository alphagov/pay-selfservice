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
  validatePassword } = require('../utils/validation/server-side-form-validations')
const { validateServiceName } = require('../utils/service-name-validation')

module.exports = {

  /**
   * Display user registration data entry form
   *
   * @param req
   * @param res
   */
  showRegistration: (req, res) => {
    const recovered = lodash.get(req, 'session.pageData.submitRegistration', {})
    lodash.unset(req, 'session.pageData.submitRegistration')
    res.render('self-create-service/register', {
      email: recovered.email,
      telephoneNumber: recovered.telephoneNumber,
      errors: recovered.errors
    })
  },

  /**
   * Process submission of service registration details
   *
   * @param req
   * @param res
   */
  submitRegistration: async function submitRegistration (req, res) {
    const correlationId = req.correlationId
    const email = req.body['email']
    const telephoneNumber = req.body['telephone-number']
    const password = req.body['password']

    const errors = {}
    const validEmail = validateEmail(email)
    if (!validEmail) {
      errors.email = validEmail.message
    }
    const validPhoneNumber = validatePhoneNumber(telephoneNumber)
    if (!validPhoneNumber) {
      errors.telephoneNumber = validPhoneNumber.message
    }
    const validPassword = validPassword(password)
    if (!validPassword) {
      errors.password = validPassword.message
    }

    if (!lodash.isEmpty(errors)) {
      lodash.set(req, 'session.pageData.submitRegistration', {
        email,
        telephoneNumber,
        errors
      })
      return res.redirect(paths.selfCreateService.register)
    }

    try {
      await registrationService.submitRegistration(email, telephoneNumber, password, correlationId)
      res.redirect(303, paths.selfCreateService.confirm)
    } catch (err) {
      if ((err.errorCode === 400 || err.errorCode === 403) &&
        err.message &&
        err.message.errors) {
        // Unfortunately we rely on error response from adminusers to provide validation errors,
        // such as the email not being a public sector email. So relay this back to the user.
        lodash.set(req, 'session.pageData.submitRegistration', {
          email,
          telephoneNumber,
          errors
        })
        return res.redirect(paths.selfCreateService.register)
      }
      if (err.errorCode === 409) {
        // Adminusers bizarrely returns a 409 when a user already exists, but sends them an email
        // to tell them this. We continue to the next page if this is the case as it will
        // tell them to check their email.
        res.redirect(303, paths.selfCreateService.confirm)
      } else {
        lodash.unset(req, 'session.pageData.submitRegistration')
        return renderErrorView(req, res)
      }
    }
  },

  /**
   * Display service creation requested page
   *
   * @param req
   * @param res
   */
  showConfirmation: (req, res) => {
    const requesterEmail = lodash.get(req, 'session.pageData.submitRegistration.email', '')
    lodash.unset(req, 'session.pageData.submitRegistration')
    res.render('self-create-service/confirm', {
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
    res.render('self-create-service/verify-otp')
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
          renderErrorView(req, res, error, err.errorCode)
        } else {
          renderErrorView(req, res, 'Unable to process registration at this time', err.errorCode || 500)
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
    res.render('self-create-service/resend-otp')
  },

  /**
   * Process re-submission of otp verification
   *
   * @param req
   * @param res
   */
  submitOtpResend: async function submitOtpResend (req, res) {
    const correlationId = req.correlationId
    const code = req.register_invite.code
    const telephoneNumber = req.body['telephone-number']

    const validPhoneNumber = validatePhoneNumber(telephoneNumber)
    if (!validPhoneNumber) {
      res.render('self-create-service/resend-otp', {
        telephoneNumber,
        errors: {
          telephoneNumber: validPhoneNumber.message
        }
      })
    }

    try {
      await registrationService.resendOtpCode(code, telephoneNumber, correlationId)
      req.register_invite.telephone_number = telephoneNumber
      res.redirect(303, paths.selfCreateService.otpVerify)
    } catch (err) {
      logger.warn(`[requestId=${req.correlationId}] Invalid invite code attempted ${req.code}, error = ${err.errorCode}`)
      if (err.errorCode === 404) {
        renderErrorView(req, res, 'Unable to process registration at this time', 404)
      } else {
        renderErrorView(req, res, 'Unable to process registration at this time', 500)
      }
    }
  },

  /**
   * Display name your service form
   *
   * @param req
   * @param res
   */
  showNameYourService: (req, res) => {
    const serviceName = lodash.get(req, 'session.pageData.submitYourServiceName.serviceName', '')
    lodash.unset(req, 'session.pageData.submitYourServiceName')
    res.render('self-create-service/set-name', {
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
      return serviceService.updateServiceName(req.user.serviceRoles[0].service.externalId, serviceName, serviceNameCy, correlationId)
        .then(() => {
          lodash.unset(req, 'session.pageData.submitYourServiceName')
          res.redirect(303, paths.dashboard.index)
        })
        .catch(err => {
          logger.debug(`[requestId=${correlationId}] invalid user input - service name`)
          renderErrorView(req, res, err)
        })
    }
  }
}
