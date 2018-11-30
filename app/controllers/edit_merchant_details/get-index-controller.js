'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const paths = require('../../paths')
const formatPath = require('../../utils/replace_params_in_path')
const {response} = require('../../utils/response')

module.exports = (req, res) => {
  const externalServiceId = req.service.externalId
  const merchantDetails = lodash.get(req, 'service.merchantDetails', undefined)
  if (!merchantDetails) {
    return res.redirect(formatPath(paths.merchantDetails.edit, externalServiceId))
  }

  const pageData = {
    merchant_details: merchantDetails,
    has_direct_debit_gateway_account: lodash.get(req, 'service.hasDirectDebitGatewayAccount'),
    has_card_gateway_account: lodash.get(req, 'service.hasCardGatewayAccount'),
    has_card_and_dd_gateway_account: lodash.get(req, 'service.hasCardAndDirectDebitGatewayAccount'),
    externalServiceId,
    editPath: formatPath(paths.merchantDetails.edit, externalServiceId)
  }
  return response(req, res, 'merchant_details/merchant_details', pageData)
}
