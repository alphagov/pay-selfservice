'use strict'

const { renderErrorView } = require('../../../utils/response')
const userService = require('../../../services/user_service')
const paths = require('../../../paths')
const { invalidTelephoneNumber } = require('../../../utils/validation/telephone-number-validation')

module.exports = async (req, res) => {
  if (invalidTelephoneNumber(req.body.phone)) {
    req.flash('genericError', '<h2>There was a problem with the details you gave for:</h2><ul class="govuk-list govuk-error-summary__list"><li><a href="#phone">Invalid telephone number.</a></li></ul>')
    return res.redirect(paths.user.phoneNumber)
  }

  try {
    await userService.updatePhoneNumber(req.user.externalId, req.body.phone)

    req.flash('generic', 'Phone number updated')
    return res.redirect(paths.user.profile)
  } catch (error) {
    return renderErrorView(req, res, 'Unable to update phone number')
  }
}
