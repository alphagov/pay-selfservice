'use strict'

const lodash = require('lodash')

const { response } = require('../../utils/response')
const productsClient = require('../../services/clients/products.client')
const supportedLanguage = require('../../models/supported-language')
const paths = require('../../paths')

module.exports = async (req, res, next) => {
  const externalServiceId = req.service && req.service.externalId
  lodash.unset(req, 'session.editPaymentLinkData')

  try {
    const paymentLinks = await productsClient.product.getByGatewayAccountIdAndType(req.account.gateway_account_id, 'ADHOC')
    const englishPaymentLinks = paymentLinks.filter(link => link.language === supportedLanguage.ENGLISH)
    const welshPaymentLinks = paymentLinks.filter(link => link.language === supportedLanguage.WELSH)
    const pageData = {
      productsLength: paymentLinks.length,
      englishPaymentLinks,
      welshPaymentLinks,
      paths,
      externalServiceId
    }
    return response(req, res, 'payment-links/manage', pageData)
  } catch (err) {
    return next(err)
  }
}
