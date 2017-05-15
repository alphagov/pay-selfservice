const logger = require('winston');
let response = require('../utils/response');
let errorResponse = response.renderErrorView;
let successResponse = response.response;
let registrationService = require('../services/registration_service');
let paths = require('../paths.js');

let validations = require('../utils/registration_validations');
let shouldProceedWithRegistration = validations.shouldProceedWithRegistration;
let validateRegistrationInputs = validations.validateRegistrationInputs;
let validateRegistrationTelephoneNumber = validations.validateRegistrationTelephoneNumber;
let validateOtp = validations.validateOtp;

const messages = {
  missingCookie: 'Unable to process registration at this time',
  internalError: 'Unable to process registration at this time'
};

let withValidatedRegistrationCookie = (req, res, next) => {
  let correlationId = req.correlationId;
  return shouldProceedWithRegistration(req.register_invite)
    .then(next)
    .catch(err => {
      logger.warn(`[requestId=${correlationId}] unable to validate required cookie for registration - ${err.errorCode}`);
      errorResponse(req, res, messages.missingCookie, 404);
    });

};

module.exports = {

  validateInvite: (req, res) => {
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
      res.redirect(302, paths.register.registration);
    };

    return registrationService.getValidatedInvite(code)
      .then(redirectToRegister)
      .catch(err => {
        logger.warn(`[requestId=${correlationId}] Invalid invite code attempted ${code}, error = ${err.errorCode}`);
        errorResponse(req, res, messages.missingCookie, 404);
        //TODO: give a different message when the code is expired - "This invitation link has expired"
      })
  },

  showRegistration: (req, res) => {
    let renderRegistrationPage = () => {
      let data = {
        email: req.register_invite.email
      };
      if (req.register_invite.telephone_number) {
        data.telephone_number = req.register_invite.telephone_number;
      }
      successResponse(req, res, 'registration/register', data);
    };

    return withValidatedRegistrationCookie(req, res, renderRegistrationPage);
  },

  submitRegistration: (req, res) => {
    let telephoneNumber = req.body['telephone-number'];
    let password = req.body['password'];
    let correlationId = req.correlationId;
    let code = req.register_invite.code;

    let proceedToVerification = () => {
      registrationService.submitRegistration(code, telephoneNumber, password, correlationId)
        .then(() => {
          req.register_invite.telephone_number = telephoneNumber;
          res.redirect(303, paths.register.otpVerify);
        })
        .catch((err) => {
          logger.error(`[requestId=${correlationId}] error submitting user registration details ${err}`);
          errorResponse(req, res, messages.internalError, 500);
        });
    };

    let redirectToDetailEntry = (err) => {
      req.register_invite.telephone_number = telephoneNumber;
      req.flash('genericError', err);
      res.redirect(303, paths.register.registration);
    };

    return withValidatedRegistrationCookie(req, res, () => {
      validateRegistrationInputs(telephoneNumber, password)
        .then(proceedToVerification)
        .catch(redirectToDetailEntry);
    });
  },

  showOtpVerify: (req, res) => {
    let displayVerifyCodePage = () => {
      successResponse(req, res, 'registration/verify_otp', {});
    };

    return withValidatedRegistrationCookie(req, res, displayVerifyCodePage);
  },

  submitOtpVerify: (req, res) => {
    let correlationId = req.correlationId;
    let verificationCode = req.body['verify-code'];
    let code = req.register_invite.code;

    let verifyOtpAndCreateUser = function () {
      registrationService.verifyOtpAndCreateUser(code, verificationCode, correlationId)
        .then((user) => {
          req.register_invite.userExternalId = user.externalId;
          res.redirect(303, paths.register.logUserIn); //TODO: temporary. probably shouldn't do this
        })
        .catch(err => {
          logger.warn(`[requestId=${correlationId}] Error during verify otp code ${err.errorCode}`);
          errorResponse(req, res, messages.internalError, 500); // TODO: code not found. retry 10 times. disable auto-complete
        });
    };

    return withValidatedRegistrationCookie(req, res, () => {
      validateOtp(verificationCode)
        .then(verifyOtpAndCreateUser)
        .catch(err => {
          logger.debug(`[requestId=${correlationId}] invalid user input - otp code`);
          req.flash('genericError', err);
          res.redirect(303, paths.register.otpVerify);
        });
    });
  },

  showReVerifyPhone: (req, res) => {
    let telephoneNumber = req.register_invite.telephone_number;

    let displayReVerifyCodePage = () => {
      let data = {
        telephone_number: telephoneNumber
      };
      successResponse(req, res, 'registration/re_verify_phone', data);
    };

    return withValidatedRegistrationCookie(req, res, displayReVerifyCodePage);
  },

  submitReVerifyPhone: (req, res) => {
    let correlationId = req.correlationId;
    let code = req.register_invite.code;
    let telephoneNumber = req.body['telephone-number'];

    let resendOtpAndProceedToVerify = () => {
      registrationService.resendOtpCode(code, telephoneNumber, correlationId)
        .then(() => {
          req.register_invite.telephone_number = telephoneNumber;
          res.redirect(303, paths.register.otpVerify);
        })
        .catch(err => {
          logger.warn(`[requestId=${correlationId}] Error during resend otp code ${err.errorCode}`);
          errorResponse(req, res, messages.internalError, 500);
        });
    };

    return withValidatedRegistrationCookie(req, res, () => {
      validateRegistrationTelephoneNumber(telephoneNumber)
        .then(resendOtpAndProceedToVerify)
        .catch(err => {
          logger.debug(`[requestId=${correlationId}] invalid user input - telephone number`);
          req.flash('genericError', err);
          req.register_invite.telephone_number = telephoneNumber;
          res.redirect(303, paths.register.reVerifyPhone);
        });
    });
  }

};
