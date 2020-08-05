'use strict'

// Local dependencies
const { renderErrorView } = require('../../../utils/response')
const userService = require('../../../services/user.service')

module.exports = async (req, res) => {
  try {
    const { telephoneNumber } = await userService.findByExternalId(req.user.externalId)
    return res.render('team-members/edit-phone-number', { telephoneNumber })
  } catch (error) {
    return renderErrorView(req, res, 'Unable to retrieve user')
  }
}
