'use strict'

const logger = require('../../utils/logger')(__filename)
const { response } = require('../../utils/response.js')
const paths = require('../../paths')
const productsClient = require('../../services/clients/products.client.js')
const { renderErrorView } = require('../../utils/response.js')
const formatAccountPathsFor = require('../../../app/utils/format-account-paths-for')

module.exports = (req, res) => {
  const params = {
    productsTab: true,
    createPage: formatAccountPathsFor(paths.account.prototyping.demoService.create, req.account.external_id),
    indexPage: formatAccountPathsFor(paths.account.prototyping.demoService.index, req.account.external_id),
    linksPage: formatAccountPathsFor(paths.account.prototyping.demoService.links, req.account.external_id)
  }

  productsClient.product.getByGatewayAccountId(req.account.gateway_account_id)
    .then(products => {
      const prototypeProducts = products.filter(product => product.type === 'PROTOTYPE')
      params.productsLength = prototypeProducts.length
      params.products = prototypeProducts
      return response(req, res, 'dashboard/demo-service/index', params)
    })
    .catch((err) => {
      logger.error(`[requestId=${req.correlationId}] Get PROTOTYPE product by gateway account id failed - ${err.message}`)
      renderErrorView(req, res)
    })
}
