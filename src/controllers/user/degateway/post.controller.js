'use strict'

const userService = require('../../../services/user.service')
const paths = require('../../../paths')
const logger = require('../../../utils/logger')(__filename)
const { SHOW_DEGATEWAY_SETTINGS } = require('../../../utils/constants')

module.exports = async function postDegatewayPreference (req, res, next) {
  const degatewayPreference = req.body['degateway-preference']

  try {
    if (!SHOW_DEGATEWAY_SETTINGS) {
      return res.redirect(paths.user.profile.index)
    }
    logger.info('User updated Degateway settings')
    const { features } = await userService.findByExternalId(req.user.externalId)
    // todo: should probably fix adminusers to take empty string for features rather than always having a value for subsequent patch requests
    const featureSet = new Set(['default'])
    features.forEach(feature => {
      if (feature !== '') featureSet.add(feature)
    })
    degatewayPreference === 'enabled' ? featureSet.add('degatewayaccountification') : featureSet.delete('degatewayaccountification')
    const updatedFeatures = Array.from(featureSet).join(',')
    await userService.updateFeatures(req.user.externalId, (updatedFeatures !== '' ? updatedFeatures : null))
    req.flash('generic', 'Account simplification preference updated')
    return res.redirect(paths.user.profile.index)
  } catch (err) {
    next(err)
  }
}
