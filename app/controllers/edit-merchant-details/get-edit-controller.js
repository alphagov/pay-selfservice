const lodash = require('lodash')
const responses = require('../../utils/response')
const { countries } = require('@govuk-pay/pay-js-commons').utils

module.exports = (req, res) => {
  let pageData = lodash.get(req, 'session.pageData.editMerchantDetails')
  if (pageData) {
    delete req.session.pageData.editMerchantDetails
  } else {
    pageData = {
      merchant_details: lodash.get(req, 'service.merchantDetails')
    }
  }
  pageData.has_direct_debit_gateway_account = lodash.get(req, 'service.hasDirectDebitGatewayAccount')
  pageData.has_card_gateway_account = lodash.get(req, 'service.hasCardGatewayAccount')
  pageData.has_card_and_dd_gateway_account = lodash.get(req, 'service.hasCardAndDirectDebitGatewayAccount')
  pageData.countries = countries.govukFrontendFormatted(lodash.get(pageData.merchant_details, 'address_country'))
  return responses.response(req, res, 'merchant-details/edit-merchant-details', pageData)
}
