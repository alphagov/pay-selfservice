const lodash = require('lodash')
const responses = require('../../utils/response')
const countries = require('../../services/countries.js')

exports.get = (req, res) => {
  let pageData = lodash.get(req, 'session.pageData.editMerchantDetails')
  if (pageData) {
    delete req.session.pageData.editMerchantDetails
  } else {
    pageData = {
      merchant_details: lodash.get(req, 'service.merchantDetails')
    }
  }
  pageData.countries = countries.retrieveCountries(lodash.get(pageData.merchant_details, 'address_country'))
  return responses.response(req, res, 'merchant_details/edit_merchant_details', pageData)
}
