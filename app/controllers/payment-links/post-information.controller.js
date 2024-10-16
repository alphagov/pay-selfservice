'use strict'

const lodash = require('lodash')
const { slugify, removeIndefiniteArticles } = require('@govuk-pay/pay-js-commons').nunjucksFilters

const paths = require('../../paths')

const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const productsClient = require('../../services/clients/products.client.js')
const { validateMandatoryField, validateNaxsiSafe } = require('../../utils/validation/server-side-form-validations')

const TITLE_MAX_LENGTH = 255

const makeNiceURL = string => {
  return slugify(removeIndefiniteArticles(string))
}

module.exports = async function postInformation (req, res, next) {
  const sessionData = lodash.get(req, 'session.pageData.createPaymentLink')
  if (!sessionData) {
    return next(new Error('Payment link data not found in session cookie'))
  }

  const title = req.body['payment-link-title']
  const description = req.body['payment-link-description']
  const serviceNamePath = req.body['service-name-path']

  const errors = {}
  const validateTitleResult = validateMandatoryField(title, TITLE_MAX_LENGTH, 'title', true)
  if (!validateTitleResult.valid) {
    errors.title = validateTitleResult.message
  }
  const validateDescriptionResult = validateNaxsiSafe(description, 'details')
  if (!validateDescriptionResult.valid) {
    errors.description = validateDescriptionResult.message
  }

  if (!lodash.isEmpty(errors)) {
    sessionData.informationPageRecovered = {
      errors,
      title,
      description
    }
    return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.information, req.account && req.account.external_id))
  }

  sessionData.paymentLinkTitle = title
  sessionData.paymentLinkDescription = description
  sessionData.serviceNamePath = makeNiceURL(serviceNamePath)
  sessionData.productNamePath = makeNiceURL(title)

  if (req.body.change === 'true') {
    req.flash('generic', 'The details have been updated')
    return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.review, req.account && req.account.external_id))
  }

  try {
    await productsClient.product.getByProductPath(sessionData.serviceNamePath, sessionData.productNamePath)
    // if product exists we need to alert the user they must use a different URL
    return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.webAddress, req.account && req.account.external_id))
  } catch (err) {
    // if it errors then it means no product was found and that’s good
    return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.reference, req.account && req.account.external_id))
  }
}
