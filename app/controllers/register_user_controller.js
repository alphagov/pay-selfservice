const logger = require('winston');
let response = require('../utils/response.js');
let errorResponse = response.renderErrorView;
let registrationService = require('../services/registration_service.js');
let paths = require('../paths.js');


module.exports = {

  invites: (req, res) => {
    let code = req.params.code;

    let successResponse = (invite) => {
      req.register_invite = {
        code: code,
        email: invite.email,
      };
      if (invite.telephone_number) {
        req.register_invite.telephone_number = invite.telephone_number;
      }
      res.redirect(302, paths.register.index);
    };

    return registrationService.getValidatedInvite(code)
      .then(successResponse)
      .catch(err => {
        logger.warn(`Invalid invite code attempted ${code}, error = ${err.errorCode}`);
        errorResponse(req, res, 'Unable to process registration', 200); //TODO discuss with Stephen
      })
  }
};
