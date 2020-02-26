const { response } = require('../../../utils/response')
const formattedPathFor = require('../../../utils/replace_params_in_path')
const paths = require('../../../paths')
const { product } = require('../../../services/clients/products_client.js')
const MetadataForm = require('./metadata-form')

const addMetadataPage = function addMetadataPage (req, res) {
  const pageData = {
    form: new MetadataForm(),
    self: formattedPathFor(paths.paymentLinks.metadata.add, req.params.productExternalId)
  }
  response(req, res, 'payment-links/metadata/edit-metadata', pageData)
}

const postMetadataPage = async function postMetadataPage (req, res) {
  let form, tested
  try {
    form = new MetadataForm(req.body)
    tested = form.validate()

    if (tested.errors.length) {
      const pageData = {
        self: formattedPathFor(paths.paymentLinks.metadata.add, req.params.productExternalId),
        tested,
        form
      }
      response(req, res, 'payment-links/metadata/edit-metadata', pageData)
      return
    } else {
      await product.addMetadataToProduct(
        req.params.productExternalId,
        form.values[form.fields.metadataKey.id],
        form.values[form.fields.metadataValue.id]
      )
      req.flash('generic', `Reporting column ${form.values[form.fields.metadataKey.id]} was added`)
      res.redirect(formattedPathFor(paths.paymentLinks.edit, req.params.productExternalId))
    }
  } catch (error) {
    const submissionError = form.parseSubmissionError(error)
    tested.errors.push(submissionError)
    if (submissionError.field) {
      tested.errorMaps[submissionError.field.id] = submissionError.text
    }
    const pageData = {
      self: formattedPathFor(paths.paymentLinks.metadata.add, req.params.productExternalId),
      tested,
      form
    }
    response(req, res, 'payment-links/metadata/edit-metadata', pageData)
  }
}

module.exports = {
  addMetadataPage,
  postMetadataPage
}
