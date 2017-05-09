const logger = require('winston');
let response = require('../utils/response.js');
let errorResponse = response.renderErrorView;
let successResponse = response.response;
let registrationService = require('../services/registration_service.js');
let paths = require('../paths.js');
let q = require('q');
let _ = require('lodash');


function shouldProceedWithRegistration(registerInviteCookie) {
  let hasValue = (param) => {
    return !_.isEmpty(_.trim(param));
  };
  let defer = q.defer();

  if (!registerInviteCookie) {
    defer.reject('request does not contain a cookie');
    return defer.promise;
  }

  if (hasValue(registerInviteCookie.email) && hasValue(registerInviteCookie.code)) {
    defer.resolve();
    return defer.promise
  } else {
    defer.reject('registration cookie does not contain the email and/or code');
    return defer.promise;
  }
}

module.exports = {

  index: (req, res) => {

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
          logger.warn(`someone attempted registration, but ${err}`);
          errorResponse(req,res, 'Unable to process registration', 404);
      });

  },

  invites: (req, res) => {
    let code = req.params.code;

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
        logger.warn(`Invalid invite code attempted ${code}, error = ${err.errorCode}`);
        errorResponse(req, res, 'Unable to process registration', 404); //TODO discuss with Stephen
      })
  }
};
