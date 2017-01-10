var _ = require('lodash');
var userService = require('../services/user_service.js');
var logger = require('winston');

const CORRELATION_HEADER = require('../utils/correlation_header.js').CORRELATION_HEADER;
const USER_NOT_AUTHORISED = "User not authorised";
/**
 * @param {String} permission User must be associated to a role with the given permission
 * to have authorization for the operation.
 *
 * For the moment if undefined, the check is skipped.
 */
module.exports = function (permission) {

  return function (req, res, next) {
    let foundUser = {};
    let username = _.get(req.user, 'username');
    let correlationId = req.headers[CORRELATION_HEADER] || '';

    if (!permission) {
      return next();
    }

    return userService.findByUsername(username, correlationId)
      .then((user) => {
        foundUser = user;
        return userService.hasPermission(foundUser, permission)
      })
      .then((hasPermission)=> {
        if (hasPermission) {
          next();
        } else {
          throw new Error(USER_NOT_AUTHORISED);
        }
      })
      .catch((e) => {
        let userId;
        if (e.message !== USER_NOT_AUTHORISED) {
          userId = foundUser.id || null;
          logger.error(`[${correlationId}] Error checking user permissons for user -`, {userId: userId, error: e});
        }

        res.render('error', {'message': 'You are not authorised to do this operation'});
      });
  }
};
