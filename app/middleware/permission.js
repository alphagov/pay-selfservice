const _ = require('lodash');
/**
 * @param {String} permission User must be associated to a role with the given permission
 * to have authorization for the operation.
 *
 * For the moment if undefined, the check is skipped.
 */
module.exports = function (permission) {
  return function (req, res, next) {

    if (!permission) {
      return next();
    }

    if (req.user.hasPermission(permission)) {
      return next();
    } else {
      return res.render('error', {'message': 'You do not have the administrator rights to perform this operation.'});
    }
  }
};
