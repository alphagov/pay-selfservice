'use strict';

const logger = require('winston');
const _ = require('lodash');
const q = require('q');

const paths = require('../paths.js');
const response = require('../utils/response');
const errorResponse = response.renderErrorView;
const registrationService = require('../services/service_registration_service');
const validations = require('../utils/registration_validations');
const loginController = require('./login_controller');
const validateRegistrationInputs = validations.validateServiceRegistrationInputs;
const serviceRegistrationEnabled = process.env.SERVICE_REGISTRATION_ENABLED === 'true';

module.exports = {

  /**
   * Display user registration data entry form
   * @param req
   * @param res
   */
  showRegistration: (req, res) => {
    if (serviceRegistrationEnabled) {
      const email = _.get(req, 'session.pageData.submitRegistration.email', '');
      const telephone_number = _.get(req, 'session.pageData.submitRegistration.telephone_number', '');
      _.unset(req, 'session.pageData.submitRegistration');
      res.render('self_create_service/index', {
        email,
        telephone_number
      });
    } else {
      errorResponse(req, res, 'Invalid route', 404);
    }
  },

  /**
   * Display service creation requested page
   * @param req
   * @param res
   */
  showRequestedPage: (req, res) => {
    const requester_email = _.get(req, 'session.pageData.submitRegistrationPageData.requesterEmail', '');
    _.unset(req, 'session.pageData.submitRegistrationPageData');
    res.render('self_create_service/confirmation', {
      requester_email
    });
  },

  /**
   * Display OTP verify page
   * @param req
   * @param res
   */
  showOtpVerify: (req, res) => {
    res.render('self_create_service/verify_otp');
  },

  /**
   * Displayname your service form
   * @param req
   * @param res
   */
  showNameYourService: (req, res) => {
    res.render('self_create_service/set_name');
  },

  /**
   * DisplayOTP resend page
   * @param req
   * @param res
   */
  showOtpResend: (req, res) => {
    res.render('self_create_service/service_creation_resend_otp');
  },

  /**
   * Process submission of service registration details
   * @param req
   * @param res
   */
  submitRegistration: (req, res) => {
    const correlationId = req.correlationId;
    const email = req.body['email'];
    const telephoneNumber = req.body['telephone-number'];
    const password = req.body['password'];

    const handleErrorCode = (err) => {
      _.set(req, 'session.pageData.submitRegistrationPageData', {
        email,
        telephone_number: telephoneNumber
      });

      if (err.errorCode === 403) {
        logger.debug(`[requestId=${correlationId}] invalid user input - 403`);
        const error = (err.message && err.message.errors) ? err.message.errors : 'Invalid input';
        req.flash('genericError', error);
        res.redirect(303, paths.selfCreateService.index);
      } else {
        errorResponse(req, res, 'Unable to process registration at this time', err.errorCode);
      }
    };

    const handleError = (err) => {
      if (err.errorCode) {
        handleErrorCode(err);
      } else {
        logger.debug(`[requestId=${correlationId}] invalid user input`);
        req.flash('genericError', err);
        res.redirect(303, paths.selfCreateService.index);
      }
    };

    const proceedToRegistration = () => {
      registrationService.submitRegistration(email, telephoneNumber, password, correlationId)
        .then(() => {
          _.set(req, 'session.pageData.submitRegistrationPageData', {
            requesterEmail: email
          });
          res.redirect(303, paths.selfCreateService.creationConfirmed);
        }).catch((err) => handleError(err));
    };

    return validateRegistrationInputs(email, telephoneNumber, password)
        .then(proceedToRegistration)
        .catch(
          (err) => handleError(err));
  },

  submitOtpVerify: (req, res) => {
    const correlationId = req.correlationId;
    const code = req.register_invite.code;
    const otpCode = req.body['verify-code'];

    const handleInvalidOtp = (message) => {
      logger.debug(`[requestId=${correlationId}] invalid user input - otp code`);
      req.flash('genericError', message);
      res.redirect(303, paths.selfCreateService.otpVerify);
    };

    const handleError = (req, res, err) => {
      logger.warn(`[requestId=${req.correlationId}] Invalid invite code attempted ${req.code}, error = ${err.errorCode}`);
      switch (err.errorCode) {
        case 401:
          handleInvalidOtp('Invalid verification code');
          break;
        case 404:
          errorResponse(req, res, 'Unable to process registration at this time', 404);
          break;
        case 410:
          errorResponse(req, res, 'This invitation is no longer valid', 410);
          break;
        default:
          errorResponse(req, res, 'Unable to process registration at this time', 500);
      }
    };

    const validateServiceOtpCode = (code, otpCode) => {
      registrationService.submitServiceInviteOtpCode(code, otpCode, correlationId)
        .then(() => res.send(200))
        .catch(
          (err) => handleError(req, res, err)
        );
    };

    return validateServiceOtpCode(code, otpCode);
  }

};
