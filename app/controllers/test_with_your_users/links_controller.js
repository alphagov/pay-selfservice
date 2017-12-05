'use strict'

const {response} = require('../../utils/response.js')
const paths = require('../../paths')
const productsClient = require('../../services/clients/products_client.js')
const authService = require('../../services/auth_service.js')
const errorView = require('../../utils/response.js').renderErrorView

module.exports = (req, res) => {
  const params = {
    productsTab: true,
    createPage: paths.prototyping.demoService.create,
    indexPage: paths.prototyping.demoService.index,
    linksPage: paths.prototyping.demoService.links
  }

  productsClient.product.getByGatewayAccountId(authService.getCurrentGatewayAccountId(req))
    .then(products => {
      params.productsLength = products.length
      params.productsSingular = products.length < 2
      params.products = products
      return response(req, res, 'dashboard/demo-service/index', params)
    })
    .catch(() => {
      errorView(req, res, 'Internal server error')
    })
}
