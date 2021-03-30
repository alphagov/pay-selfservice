'use strict'

const lodash = require('lodash')

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
    externalServiceId,
    editPath: formatPath(paths.merchantDetails.edit, externalServiceId)
  }
  return response(req, res, 'merchant-details/merchant-details', pageData)
}
