const resolveService = require('./resolve_service')
/**
 * @param {String} permission User must be associated to a role with the given permission
 * to have authorization for the operation.
 *
 * For the moment if undefined, the check is skipped.
 */
module.exports = function (permission) {
  const isDevelopment = process.env.NODE_END === 'development'
  return [resolveService, function (req, res, next) {
    if (!permission || isDevelopment) {
      return next()
    }

    if (req.user.hasPermission(req.service.externalId, permission)) {
      return next()
    } else {
      return res.status(401).render('error', { 'message': 'You do not have the administrator rights to perform this operation.' })
    }
  }]
}
