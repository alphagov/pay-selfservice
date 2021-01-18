'use strict'

const lodash = require('lodash')

const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')

module.exports = function postEditInformation (req, res) {
  const { productExternalId } = req.params

  const sessionData = lodash.get(req, 'session.editPaymentLinkData')
  if (!sessionData || sessionData.externalId !== productExternalId) {
    req.flash('genericError', 'Something went wrong. Please try again.')
    return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.manage.index, req.account && req.account.external_id))
  }

  const name = req.body['payment-link-title']
  const description = req.body['payment-link-description']

  if (name === '') {
    const errors = {
      title: 'Enter a title'
    }
    sessionData.informationPageRecovered = {
      errors,
      name,
      description
    }
    return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.manage.editInformation, req.account && req.account.external_id, productExternalId))
  }

  sessionData.name = name
  sessionData.description = description

  return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.manage.edit, req.account && req.account.external_id, productExternalId))
}
