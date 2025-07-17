'use strict'

const { response } = require('@utils/response.js')
const paths = require('../../../../paths')
const productsClient = require('@services/clients/products.client.js')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')

module.exports = async function getIndex (req, res, next) {
  const params = {
    productsTab: true,
    createLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.create, req.service.externalId, req.account.type),
    indexLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.index, req.service.externalId, req.account.type),
    prototypesLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.links, req.service.externalId, req.account.type),
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.index, req.service.externalId, req.account.type)
  }

  try {
    const prototypeProducts = await productsClient.product.getByGatewayAccountIdAndType(req.account.id, 'PROTOTYPE')
    params.productsLength = prototypeProducts.length
    params.products = prototypeProducts
    return response(req, res, 'dashboard/demo-service/index', params)
  } catch (err) {
    next(err)
  }
}
