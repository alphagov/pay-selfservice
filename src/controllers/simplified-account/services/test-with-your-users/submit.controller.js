'use strict'

const lodash = require('lodash')

const logger = require('@utils/logger')(__filename)
const { response } = require('@utils/response.js')
const paths = require('../../../../paths')
const productsClient = require('@services/clients/products.client.js')
const productTypes = require('@utils/product-types')
const publicAuthClient = require('@services/clients/public-auth.client')
const { isCurrency, isHttps, isAboveMaxAmount } = require('@utils/validation/field-validation-checks')
const { penceToPounds, safeConvertPoundsStringToPence } = require('@utils/currency-formatter')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')

module.exports = async (req, res) => {
  const gatewayAccountId = req.account.id
  const confirmationPage = req.body['confirmation-page']
  const paymentDescription = req.body['payment-description']
  const paymentAmountInPence = safeConvertPoundsStringToPence(req.body['payment-amount'], true)
  lodash.set(req, 'session.pageData.createPrototypeLink', { paymentAmountInPence, paymentDescription, confirmationPage })

  if (!paymentDescription) {
    req.flash('genericError', 'Enter a description')
  } else if (!paymentAmountInPence || isCurrency(penceToPounds(paymentAmountInPence))) {
    req.flash('genericError', isCurrency(paymentAmountInPence))
  } else if (isAboveMaxAmount(penceToPounds(paymentAmountInPence))) {
    req.flash('genericError', isAboveMaxAmount(penceToPounds(paymentAmountInPence)))
  } else if (!confirmationPage || isHttps(confirmationPage)) {
    req.flash('genericError', isHttps(confirmationPage))
  }

  if (lodash.get(req, 'session.flash.genericError.length')) {
    return res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.create, req.service.externalId, req.account.type))
  }

  try {
    const publicAuthData = await publicAuthClient.createTokenForAccount({
      accountId: gatewayAccountId,
      payload: {
        account_id: gatewayAccountId,
        created_by: req.user.email,
        description: `Token for Prototype: ${req.body['payment-description']}`,
        type: 'PRODUCTS',
        service_external_id: req.service.externalId,
        service_mode: req.account.type
      }
    })

    const product = await productsClient.product.create({
      payApiToken: publicAuthData.token,
      gatewayAccountId,
      name: req.body['payment-description'],
      returnUrl: req.body['confirmation-page'],
      price: paymentAmountInPence,
      type: productTypes.PROTOTYPE
    })

    const prototypeLink = lodash.get(product, 'links.pay.href')
    lodash.set(req, 'session.pageData.createPrototypeLink', {})

    const context = {
      prototypeLink,
      backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.links, req.service.externalId, req.account.type),
      prototypesLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.links,  req.service.externalId, req.account.type),
    }

    return response(req, res, 'simplified-account/services/test-with-your-users/confirm', context)
  } catch (err) {
    logger.error(`Create product failed - ${err.message}`)
    req.flash('genericError', 'Something went wrong. Please try again or contact support.')
    return res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.create, req.service.externalId, req.account.type))
  }
}
