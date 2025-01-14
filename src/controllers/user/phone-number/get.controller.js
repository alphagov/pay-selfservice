'use strict'

const { response } = require('../../../utils/response')
const userService = require('../../../services/user.service')

module.exports = async function showUpdatePhoneNumber (req, res, next) {
  try {
    const { telephoneNumber } = await userService.findByExternalId(req.user.externalId)
    return response(req, res, 'team-members/edit-phone-number', { telephoneNumber })
  } catch (err) {
    next(err)
  }
}
