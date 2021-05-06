'use strict'

const { response } = require('../../utils/response.js')
const paths = require('../../paths')
const productsClient = require('../../services/clients/products.client.js')
const formatAccountPathsFor = require('../../../app/utils/format-account-paths-for')

module.exports = async function getIndex (req, res, next) {
  const params = {
    productsTab: true,
    createPage: formatAccountPathsFor(paths.account.prototyping.demoService.create, req.account.external_id),
    indexPage: formatAccountPathsFor(paths.account.prototyping.demoService.index, req.account.external_id),
    linksPage: formatAccountPathsFor(paths.account.prototyping.demoService.links, req.account.external_id)
  }

  try {
    const prototypeProducts = await productsClient.product.getByGatewayAccountIdAndType(req.account.gateway_account_id, 'PROTOTYPE')
    params.productsLength = prototypeProducts.length
    params.products = prototypeProducts
    return response(req, res, 'dashboard/demo-service/index', params)
  } catch (err) {
    next(err)
  }
}
