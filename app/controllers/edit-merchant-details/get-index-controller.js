'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const paths = require('../../paths')
const formatPath = require('../../utils/replace-params-in-path')
const { response } = require('../../utils/response')

module.exports = (req, res) => {
  const externalServiceId = req.service.externalId
  const merchantDetails = lodash.get(req, 'service.merchantDetails', undefined)
  if (!merchantDetails ||
    !merchantDetails.name ||
    !merchantDetails.address_line1 ||
    !merchantDetails.address_city ||
    !merchantDetails.address_postcode ||
    !merchantDetails.address_country) {
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
