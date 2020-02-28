const { response } = require('../../../utils/response')
const formattedPathFor = require('../../../utils/replace_params_in_path')
const paths = require('../../../paths')
const { product } = require('../../../services/clients/products_client.js')
const MetadataForm = require('./metadata-form')
const auth = require('../../../services/auth_service.js')

const addMetadataPage = function addMetadataPage (req, res) {
  const pageData = {
    form: new MetadataForm(),
    self: formattedPathFor(paths.paymentLinks.metadata.add, req.params.productExternalId),
    cancelRoute: formattedPathFor(paths.paymentLinks.edit, req.params.productExternalId)
  }
  response(req, res, 'payment-links/metadata/edit-metadata', pageData)
}

const editMetadataPage = async function editMetadataPage (req, res) {
  const { productExternalId, metadataKey } = req.params
  const gatewayAccountId = auth.getCurrentGatewayAccountId(req)

  try {
    const currentProduct = await product.getByProductExternalId(gatewayAccountId, productExternalId)
    const metadataValue = currentProduct.metadata[metadataKey]

    if (metadataValue === undefined) {
      res.status(404).render('404')
      return
    }

    const prefilledPage = {
      'metadata-column-header': metadataKey,
      'metadata-cell-value': metadataValue
    }
    const pageData = {
      form: new MetadataForm(prefilledPage),
      isEditing: true,
      self: formattedPathFor(paths.paymentLinks.metadata.edit, req.params.productExternalId, metadataKey),
      cancelRoute: formattedPathFor(paths.paymentLinks.edit, req.params.productExternalId)
    }
    response(req, res, 'payment-links/metadata/edit-metadata', pageData)
  } catch (error) {

  }
}

const updateMetadataPage = function updateMetadataPage (updateMethod, path) {
  // return the controller that will be passed through to the express stack
  return async (req, res, next) => {
    let form, tested
    const pageContext = {
      cancelRoute: formattedPathFor(paths.paymentLinks.edit, req.params.productExternalId)
    }
    try {
      form = new MetadataForm(req.body)
      tested = form.validate()
      pageContext.self = formattedPathFor(path, req.params.productExternalId, form.values[form.fields.metadataKey.id])

      if (tested.errors.length) {
        response(req, res, 'payment-links/metadata/edit-metadata', { ...pageContext, tested, form })
        return
      } else {
        await updateMethod(
          req.params.productExternalId,
          form.values[form.fields.metadataKey.id],
          form.values[form.fields.metadataValue.id]
        )
        req.flash('generic', `Updated reporting column ${form.values[form.fields.metadataKey.id]}`)
        res.redirect(formattedPathFor(paths.paymentLinks.edit, req.params.productExternalId))
      }
    } catch (error) {
      const submissionError = form.parseSubmissionError(error)
      tested.errors.push(submissionError)
      if (submissionError.field) {
        tested.errorMaps[submissionError.field.id] = submissionError.text
      }
      response(req, res, 'payment-links/metadata/edit-metadata', { ...pageContext, tested, form })
    }
  }
}

const postMetadataPage = updateMetadataPage(product.addMetadataToProduct, paths.paymentLinks.metadata.add)
const editMetadataPost = updateMetadataPage(product.updateProductMetadata, paths.paymentLinks.metadata.edit)

module.exports = {
  addMetadataPage,
  postMetadataPage,
  editMetadataPage,
  editMetadataPost
}
