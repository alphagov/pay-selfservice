const { response } = require('../../../utils/response.js')
const formattedPathFor = require('../../../utils/replace_params_in_path')
const paths = require('../../../paths')
const lodash = require('lodash')

const addMetadataPage = function addMetadataPage (req, res, next) {
  // @TODO(sfount) rethink how response works, get repsonse context from library and render _in_ the contrller
  const pageData = {
    self: formattedPathFor(paths.paymentLinks.metadata.add, req.params.productExternalId)
  }

  response(req, res, 'payment-links/metadata/edit-metadata', pageData)
}

const postMetadataPage = (req, res) => {
  const pageData = lodash.get(req, 'session.pageData.createPaymentLink', {})
  let updatedPageData = lodash.cloneDeep(pageData)

  updatedPageData.metadataColumnHeader = req.body['metadata-column-header']
  updatedPageData.PaymentLinkDescription = req.body['payment-link-description']

  return res.redirect(paths.paymentLinks.information)
}

module.exports = {
  addMetadataPage,
  postMetadataPage
}
