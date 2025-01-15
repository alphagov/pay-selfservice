'use strict'

const restrictServiceExperimentalFeatures = function restrictServiceExperimentalFeatures (req, res, next) {
  if (req.service && !req.service.experimentalFeaturesEnabled) {
    res.status(404).render('404')
    return
  }
  next()
}

module.exports = restrictServiceExperimentalFeatures
