const lodash = require('lodash')
const responses = require('../../utils/response')
const countries = require('../../services/countries.js')

module.exports = (req, res) => {
  const externalServiceId = req.params.externalServiceId
  let pageData = lodash.get(req, 'session.pageData.editMerchantDetails')
  if (pageData) {
    delete req.session.pageData.editMerchantDetails
  } else {
    pageData = {
      merchant_details: lodash.get(req, 'service.merchantDetails'),
      has_direct_debit_gateway_account: lodash.get(req, 'service.hasDirectDebitGatewayAccount'),
      has_card_gateway_account: lodash.get(req, 'service.hasCardGatewayAccount'),
      has_card_and_dd_gateway_account: lodash.get(req, 'service.hasCardAndDirectDebitGatewayAccount'),
      externalServiceId
    }
  }
  pageData.countries = countries.retrieveCountries(lodash.get(pageData.merchant_details, 'address_country'))
  return responses.response(req, res, 'merchant_details/edit_merchant_details', pageData)
}
