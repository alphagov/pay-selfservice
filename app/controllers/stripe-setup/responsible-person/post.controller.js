'use strict'

// NPM dependencies
const lodash = require('lodash')
// Local dependencies
const paths = require('../../../paths')
const response = require('../../../utils/response')

module.exports = (req, res) => {
  const pageData = {
    firstName: lodash.get(req, 'body.first-name', ''),
    lastName: lodash.get(req, 'body.last-name', ''),
    homeAddressLine1: lodash.get(req, 'body.home-address-line-1', ''),
    homeAddressLine2: lodash.get(req, 'body.home-address-line-2', ''),
    homeAddressCity: lodash.get(req, 'body.home-address-city', ''),
    homeAddressPostcode: lodash.get(req, 'body.home-address-postcode', ''),
    dobDay: lodash.get(req, 'body.dob-day', ''),
    dobMonth: lodash.get(req, 'body.dob-month', ''),
    dobYear: lodash.get(req, 'body.dob-year', '')
  }

  if (lodash.get(req, 'body.answers-checked') === 'true') {
    return res.redirect(303, paths.dashboard.index)
  } else if (lodash.get(req, 'body.answers-need-changing') === 'true') {
    return response.response(req, res, 'stripe-setup/responsible-person/index', pageData)
  }
  return response.response(req, res, 'stripe-setup/responsible-person/check-your-answers', pageData)
}
