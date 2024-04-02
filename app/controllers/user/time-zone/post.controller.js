'use strict'

const userService = require('../../../services/user.service')
const paths = require('../../../paths')

module.exports = async (req, res, next) => {
  const timeZone = req.body['timeZone']

  try {
    await userService.updateTimeZone(req.user.externalId, timeZone)

    req.flash('generic', 'Time zone updated')
    return res.redirect(paths.user.profile.index)
  } catch (err) {
    next(err)
  }
}
