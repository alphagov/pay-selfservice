const logger = require('winston');
let response = require('../utils/response');
let errorResponse = response.renderErrorView;
let successResponse = response.response;
let registrationService = require('../services/registration_service');
let paths = require('../paths.js');

let validations = require('../utils/registration_validations');
let shouldProceedWithRegistration = validations.shouldProceedWithRegistration;
let validateRegistrationInputs = validations.validateRegistrationInputs;

module.exports = {

  index: (req, res) => {
    let correlationId = req.correlationId;

    let renderRegistrationPage = () => {
      let data = {
        email: req.register_invite.email
      };
      if (req.register_invite.telephone_number) {
        data.telephone_number = req.register_invite.telephone_number;
      }
      successResponse(req, res, 'registration/register', data);
    };

    return shouldProceedWithRegistration(req.register_invite)
      .then(renderRegistrationPage)
      .catch(err => {
        logger.warn(`[requestId=${correlationId}] someone attempted registration, but ${err}`);
        errorResponse(req, res, 'Unable to process registration', 404);
      });

  },

  invites: (req, res) => {
    let code = req.params.code;
    let correlationId = req.correlationId;

    let redirectToRegister = (invite) => {

      if (!req.register_invite) {
        req.register_invite = {};
      }
      req.register_invite.code = code;
      req.register_invite.email = invite.email;
      if (invite.telephone_number) {
        req.register_invite.telephone_number = invite.telephone_number;
      }
      res.redirect(302, paths.register.index);
    };

    return registrationService.getValidatedInvite(code)
      .then(redirectToRegister)
      .catch(err => {
        logger.warn(`[requestId=${correlationId}] Invalid invite code attempted ${code}, error = ${err.errorCode}`);
        errorResponse(req, res, 'Unable to process registration', 404);
      })
  },

  submitDetails: (req, res) => {

    let telephoneNumber = req.body['telephone-number'];
    let password = req.body['password'];
    let correlationId = req.correlationId;
    let code = req.register_invite.code;

    let proceedToVerification = () => {
      registrationService.submitRegistration(code,telephoneNumber,password,correlationId)
        .then(() => {
          req.register_invite.telephone_number = telephoneNumber;
          res.redirect(303, paths.register.verifyPhone);
        })
        .catch((err) => {
          logger.error(`[requestId=${correlationId}] error submitting user registration details ${err}`);
          errorResponse(req, res, 'Unable to process registration', 500);
        });
    };

    let redirectToDetailEntry = (err) => {
      req.register_invite.telephone_number = telephoneNumber;
      req.flash('genericError', err);
      res.redirect(303, paths.register.index);
    };

    shouldProceedWithRegistration(req.register_invite)
      .then(() =>
        validateRegistrationInputs(telephoneNumber, password)
          .then(proceedToVerification)
          .catch(redirectToDetailEntry)
      )
      .catch(err => {
        logger.warn(`[requestId=${correlationId}] Error during registration ${err}`);
        errorResponse(req, res, 'Unable to process registration', 404);
      })
  },

  verifyPhone: (req, res) => {
   //TODO
  }
};
