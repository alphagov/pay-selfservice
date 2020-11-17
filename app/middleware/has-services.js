const _ = require('lodash')
const logger = require('../utils/logger')(__filename)
const paths = require('../paths')

// TMP(sfount) we're not sure what this is doing - we don't think this will be needed
// IFF you've got access to no services - redirct to my-services to create one
// - Proposed structure won't let you get to an account or service page without being explicitly directed there
// - IFF the user doesn't have access, 404 or 403 should be shown
module.exports = (req, res, next) => {
  const serviceRoles = _.get(req, 'user.serviceRoles', [])
  if (req.url !== paths.serviceSwitcher.index && serviceRoles.length === 0) {
    logger.info('User does not belong to any service user_external_id=', _.get(req, 'user.externalId'))
    res.redirect(paths.serviceSwitcher.index)
  } else {
    next()
  }
}
