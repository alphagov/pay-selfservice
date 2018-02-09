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
      const prototypeProducts = products.filter(product => product.type === 'PROTOTYPE')
      params.productsLength = prototypeProducts.length
      params.productsSingular = prototypeProducts.length < 2
      params.products = prototypeProducts
      return response(req, res, 'dashboard/demo-service/index', params)
    })
    .catch(() => {
      errorView(req, res, 'Internal server error')
    })
}
