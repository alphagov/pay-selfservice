var _ = require('lodash');
var User = require('../models/user.js');
var logger = require('winston');
var CORRELATION_HEADER = require('../utils/correlation_header.js').CORRELATION_HEADER;

/**
 * @param {String} permission User must be associated to a role with the given permission
 * to have authorization for the operation.
 *
 * For the moment if undefined, the check is skipped.
 */
var permission = function (permission) {

  return function (req, res, next) {

    var username = _.get(req.user, 'username');
    var correlationId = req.headers[CORRELATION_HEADER] || '';

    if (permission) {
      User.findByUsername(username, correlationId)
        .then((user)=> {
            user.hasPermission(permission)
              .then((hasPermission)=> {
                  if (hasPermission) {
                    next();
                  } else {
                    res.render('error', {'message': 'You are not Authorized to do this operation'});
                  }
                },
                (e)=> {
                  logger.error(`[${correlationId}] Error checking user role -`, {userId: user.id, error: e});
                  throw new Error("Could not check user permission");
                })
          },
          (e)=> {
            logger.error(`[${correlationId}] Error retrieving user -`, {error: e});
            throw new Error("Could not get user");
          });
    } else {
      next();
    }
  }
};

module.exports = permission;
