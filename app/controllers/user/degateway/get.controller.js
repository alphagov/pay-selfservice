'use strict'

const { response } = require('../../../utils/response')
const userService = require('../../../services/user.service')

module.exports = async function getDegatewayPreference (req, res, next) {
  try {
    const user = await userService.findByExternalId(req.user.externalId)
    const degatewayPreference = user.isDegatewayed()
    return response(req, res, 'team-members/edit-degateway-preference', { degatewayPreference })
  } catch (err) {
    next(err)
  }
}
