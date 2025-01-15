'use strict'

const { response } = require('../../../utils/response')
const userService = require('../../../services/user.service')
const { SHOW_DEGATEWAY_SETTINGS } = require('../../../utils/constants')
const paths = require('../../../paths')
const logger = require('../../../utils/logger')(__filename)

module.exports = async function getDegatewayPreference (req, res, next) {
  if (!SHOW_DEGATEWAY_SETTINGS) {
    res.redirect(paths.user.profile.index)
    return
  }
  logger.info('User viewed Degateway settings')
  try {
    const user = await userService.findByExternalId(req.user.externalId)
    const degatewayPreference = user.isDegatewayed()
    return response(req, res, 'team-members/edit-degateway-preference', { degatewayPreference })
  } catch (err) {
    next(err)
  }
}
