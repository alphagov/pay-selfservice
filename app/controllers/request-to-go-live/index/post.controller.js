'use strict'

// Local dependencies
const paths = require('../../../paths')

module.exports = (req, res) => {
  // TODO: finish the UI implementation and logic
  const externalServiceId = req.service.externalId
  res.redirect(303, paths.requestToGoLive.index.replace(':externalServiceId', externalServiceId))
}
