'use strict'

const {response} = require('../../utils/response.js')
const paths = require('../../paths')
const productsClient = require('../../services/clients/products_client.js')
const authService = require('../../services/auth_service.js')

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
      params.productsSingular = products.length === 1
      products.forEach(function (product) {
        product.price = (product.price / 100).toFixed(2)
      })
      console.log(products)
      params.products = products
      return response(req, res, 'dashboard/demo-service/index', params)
    })
    .catch(error => {
      console.log(error)
      return response(req, res, 'dashboard/demo-service/index', params)
    })
}
