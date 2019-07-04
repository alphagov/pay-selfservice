'use strict'

// Local dependencies
const { renderErrorView } = require('../../../utils/response')
const userService = require('../../../services/user_service')
const paths = require('../../../paths')

module.exports = async (req, res) => {
  try {
    await userService.updatePhoneNumber(req.user.externalId, req.body.phone)

    req.flash('generic', 'Phone number updated')
    return res.redirect(paths.user.profile)
  } catch (error) {
    return renderErrorView(req, res, 'Unable to update phone number')
  }
}
