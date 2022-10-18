'use strict'

const lodash = require('lodash')

const logger = require('../../../utils/logger')(__filename)
const userService = require('../../../services/user.service.js')
const paths = require('../../../paths')
const secondFactorMethod = require('../../../models/second-factor-method')

module.exports = async (req, res) => {
  const method = req.body['two-fa-method']
  lodash.set(req, 'session.pageData.twoFactorAuthMethod', method)

    try {
      const user = await userService.provisionNewOtpKey(req.user.externalId, req.correlationId)
      if (method === secondFactorMethod.SMS) {
        await userService.sendProvisionalOTP(user, req.correlationId)
      }
      return res.redirect(paths.user.profile.twoFactorAuth.configure)
    } catch (err) {
      logger.error(`Provisioning new OTP key failed - ${err.message}`)
      req.flash('genericError', 'Something went wrong. Please try again or contact support.')
      return res.redirect(paths.user.profile.twoFactorAuth.index)
  }
}
