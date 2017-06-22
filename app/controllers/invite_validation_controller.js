'use strict';

// Node.js core dependencies
const logger = require('winston');

// Custom dependencies
const response = require('../utils/response');
const errorResponse = response.renderErrorView;
const registrationService = require('../services/validate_invite_service');
const paths = require('../paths');

const messages = {
  missingCookie: 'Unable to process registration at this time',
  internalError: 'Unable to process registration at this time',
  linkExpired: 'This invitation is no longer valid',
  invalidOtp: 'Invalid verification code'
};

const handleError = (req, res, err) => {
  logger.warn(`[requestId=${req.correlationId}] Invalid invite code attempted ${req.code}, error = ${err.errorCode}`);

  switch (err.errorCode) {
    case 404:
      errorResponse(req, res, messages.missingCookie, 404);
      break;
    case 410:
      errorResponse(req, res, messages.linkExpired, 410);
      break;
    default:
      errorResponse(req, res, messages.missingCookie, 500);
  }
};

module.exports = {

  /**
   * intermediate endpoint which captures the invite code and validate.
   * Upon success this forwards the request to proceed with registration
   * @param req
   * @param res
   * @returns {Promise.<T>}
   */
  validateInvite: (req, res) => {
    const code = req.params.code;
    const correlationId = req.correlationId;
    const redirect = (invite) => {
      let redirectTarget;

      if (!req.register_invite) {
        req.register_invite = {};
      }

      req.register_invite.code = code;

      if (invite.telephone_number) {
        req.register_invite.telephone_number = invite.telephone_number;
      }

      switch(invite.type) {
        case 'user':
          req.register_invite.email = invite.email;
          redirectTarget = paths.registerUser.registration;
          break;
        case 'service':
          redirectTarget = paths.selfCreateService.otpVerify;
          break;
        default:
          handleError(req, res, 'Unrecognised invite type');
      }
      res.redirect(302, redirectTarget);
    };

    return registrationService.getValidatedInvite(code, correlationId)
      .then(redirect)
      .catch((err) => handleError(req, res, err));
  }
};