var _ = require('lodash');
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

    if (req.user.hasPermission(permission)) {
      return next();
    } else {
      return res.render('error', {'message': 'You are not authorised to do this operation'});
    }
  }
};
