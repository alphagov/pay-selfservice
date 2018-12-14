const lodash = require('lodash')
const responses = require('../../utils/response')
const countries = require('../../services/countries.js')
const stripe = require('stripe')('API-KEY-HERE')

module.exports = (req, res) => {
  const externalServiceId = req.service.externalId
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
  pageData.countries = countries.govukFrontendFormatted(lodash.get(pageData.merchant_details, 'address_country'))
  // list all stripe files
  // https://stripe.com/docs/api/files/list
  stripe.files.list({
    purpose: 'identity_document'
  }, (err, files) => {
    if (err) {
      console.log('err')
      console.log(err)
    } else {
      pageData.files = files
      console.log(JSON.stringify(pageData.files))
      return responses.response(req, res, 'merchant_details/edit_merchant_details', pageData)
    }
  })
}
