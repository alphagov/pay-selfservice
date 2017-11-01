const lodash = require('lodash')
const responses = require('../../utils/response')
const countries = require('../../services/countries.js')

exports.get = (req, res) => {
  const merchantDetails = lodash.get(req, 'service.merchantDetails')
  let pageData = lodash.get(req, 'session.pageData.editMerchantDetails')
  if (pageData) {
    delete req.session.pageData.editMerchantDetails
  } else {
    pageData = {}
  }
  pageData.merchant_details = merchantDetails
  pageData.countries = countries.retrieveCountries(lodash.get(merchantDetails, 'address_country'))
  return responses.response(req, res, 'merchant_details/edit_merchant_details', pageData)
}
