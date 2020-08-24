'use strict'

// Local dependencies
const { renderErrorView } = require('../../../utils/response')
const userService = require('../../../services/user.service')
const paths = require('../../../paths')
const { invalidTelephoneNumber } = require('../../../utils/validation/telephone-number-validation')

module.exports = async (req, res) => {
  if (invalidTelephoneNumber(req.body.phone)) {
    req.flash('error', 'Invalid telephone number. Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192')
    return res.redirect(paths.user.phoneNumber)
  }

  try {
    await userService.updatePhoneNumber(req.user.externalId, req.body.phone)

    req.flash('generic', 'Phone number updated')
    return res.redirect(paths.user.profile)
  } catch (error) {
    return renderErrorView(req, res, 'Unable to update phone number. Please try again or contact support team.')
  }
}
