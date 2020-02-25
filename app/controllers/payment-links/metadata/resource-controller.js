const { response } = require('../../../utils/response')
const formattedPathFor = require('../../../utils/replace_params_in_path')
const paths = require('../../../paths')
const { product } = require('../../../services/clients/products_client.js')

const addMetadataPage = function addMetadataPage (req, res) {
  const pageData = {
    self: formattedPathFor(paths.paymentLinks.metadata.add, req.params.productExternalId)
  }
  response(req, res, 'payment-links/metadata/edit-metadata', pageData)
}

const postMetadataPage = async function postMetadataPage (req, res) {
  const key = req.body['metadata-column-header']
  const value = req.body['metadata-cell-value']

  try {
    await product.addMetadataToProduct(req.params.productExternalId, key, value)
    req.flash('generic', `Reporting column ${key} was added`)
    res.redirect(formattedPathFor(paths.paymentLinks.edit, req.params.productExternalId))
  } catch (error) {
    const pageData = {
      self: formattedPathFor(paths.paymentLinks.metadata.add, req.params.productExternalId),
      error: error.message,
      metadataColumnHeader: key,
      metadataColumnValue: value
    }
    req.flash('genericError', error.message)
    response(req, res, 'payment-links/metadata/edit-metadata', pageData)
  }
}

module.exports = {
  addMetadataPage,
  postMetadataPage
}
