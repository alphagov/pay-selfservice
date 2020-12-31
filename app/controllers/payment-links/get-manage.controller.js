'use strict'

const lodash = require('lodash')

const logger = require('../../utils/logger')(__filename)
const { response } = require('../../utils/response')
const productsClient = require('../../services/clients/products.client')
const authService = require('../../services/auth.service')
const { renderErrorView } = require('../../utils/response')
const supportedLanguage = require('../../models/supported-language')
const paths = require('../../paths')

module.exports = async (req, res) => {
  const externalServiceId = req.service && req.service.externalId
  lodash.unset(req, 'session.editPaymentLinkData')

  try {
    const products = await productsClient.product.getByGatewayAccountId(authService.getCurrentGatewayAccountId(req))
    const paymentLinks = products.filter(product => product.type === 'ADHOC')
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
    logger.error(`[requestId=${req.correlationId}] Get ADHOC product by gateway account id failed - ${err.message}`)
    return renderErrorView(req, res)
  }
}
