'use strict'

// Local dependencies
const paths = require('../../../paths')

module.exports = (req, res) => {
  const externalServiceId = req.service.externalId
  res.redirect(303, paths.requestToGoLive.index.replace(':externalServiceId', externalServiceId))
}
