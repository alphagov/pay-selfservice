'use strict'

const lodash = require('lodash')

const userService = require('../../../services/user.service.js')
const paths = require('../../../paths')
const secondFactorMethod = require('../../../models/second-factor-method')

module.exports = async (req, res, next) => {
  const method = req.body['two-fa-method']
  lodash.set(req, 'session.pageData.twoFactorAuthMethod', method)

  if (method === secondFactorMethod.SMS && !req.user.telephoneNumber) {
    res.redirect(paths.user.profile.twoFactorAuth.phoneNumber)
  } else {
    try {
      await userService.provisionNewOtpKey(req.user.externalId, req.correlationId)
      if (method === secondFactorMethod.SMS) {
        await userService.sendProvisionalOTP(req.user.externalId, req.correlationId)
      }
      return res.redirect(paths.user.profile.twoFactorAuth.configure)
    } catch (err) {
      next(err)
    }
  }
}
