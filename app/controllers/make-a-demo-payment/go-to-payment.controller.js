'use strict'

const lodash = require('lodash')

const logger = require('../../utils/logger')(__filename)
const paths = require('../../paths')
const productsClient = require('../../services/clients/products.client.js')
const productTypes = require('../../utils/product-types')
const publicAuthClient = require('../../services/clients/public-auth.client')

module.exports = async function makeDemoPayment (req, res) {
  const gatewayAccountId = req.account.gateway_account_id
  const { paymentAmount, paymentDescription } = lodash.get(req, 'session.pageData.makeADemoPayment', {})

  if (!paymentAmount || !paymentDescription) {
    return res.redirect(paths.prototyping.demoPayment.index)
  }

  try {
    const createTokenResponse = await publicAuthClient.createTokenForAccount({
      accountId: gatewayAccountId,
      correlationId: req.correlationId,
      payload: {
        account_id: gatewayAccountId,
        created_by: req.user.email,
        description: `Token for Demo Payment`,
        type: 'PRODUCTS'
      }
    })
    const createProductResponse = await productsClient.product.create({
      payApiToken: createTokenResponse.token,
      gatewayAccountId,
      name: paymentDescription,
      price: paymentAmount,
      type: productTypes.DEMO
    })

    lodash.unset(req, 'session.pageData.makeADemoPayment')
    res.redirect(createProductResponse.links.pay.href)
  } catch (error) {
    logger.error(`[requestId=${req.correlationId}] Making a demo payment failed - ${error.message}`)
    req.flash('genericError', 'Something went wrong. Please try again.')
    res.redirect(paths.prototyping.demoPayment.index)
  }
}
