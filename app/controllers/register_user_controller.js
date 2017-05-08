const logger = require('winston');
let response = require('../utils/response.js');
let errorResponse = response.renderErrorView;
let successResponse = response.response;
let registrationService = require('../services/registration_service.js');
let paths = require('../paths.js');


module.exports = {

  index: (req, res) => {
    let data = {
      email: req.register_invite.email
    };

    if (req.register_invite.telephone_number) {
      data.telephone_number = req.register_invite.telephone_number;
    }
    successResponse(req, res, 'registration/register', data);
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
        errorResponse(req, res, 'Unable to process registration', 200); //TODO discuss with Stephen
      })
  }
};
