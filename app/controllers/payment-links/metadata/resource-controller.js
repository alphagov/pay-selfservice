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
      // req.flash('genericError', error.message)
      response(req, res, 'payment-links/metadata/edit-metadata', pageData)
      return
    } else {
      // move values to getters
      await product.addMetadataToProduct(
        req.params.productExternalId,
        form.values[form.fields.metadataKey.id],
        form.values[form.fields.metadataValue.id]
      )
      req.flash('generic', `Reporting column ${form.values[form.fields.metadataKey.id]} was added`)
      res.redirect(formattedPathFor(paths.paymentLinks.edit, req.params.productExternalId))
    }
  } catch (error) {
    const serverError = parseServerError(form, tested, error)
    tested.errors.push(serverError)
    const pageData = {
      self: formattedPathFor(paths.paymentLinks.metadata.add, req.params.productExternalId),
      tested,
      form
    }
    // req.flash('genericError', error.message)
    response(req, res, 'payment-links/metadata/edit-metadata', pageData)
  }
}

// @FIXME(sfount) side effects all over this
// @TODO(sfount) move to metadata form - server validation will all be in the same bag
function parseServerError (form, tested, error) {
  const knownCodes = {
    DUPLICATE_METADATA_KEYS: {
      field: form.fields.metadataKey,
      href: `#${form.fields.metadataKey.id}`,
      text: 'Column header must be unique for this payment link'
    }
  }
  let theerror

  Object.keys(knownCodes).some((key) => {
    const code = knownCodes[key]
    if (key === error.errorIdentifier) {
      tested.errorMaps[code.field.id] = code.text
      theerror = code
      return true
    }
    return false
  })

  return theerror || {
    href: '#',
    text: 'Unknown problem with adding reporting column'
  }
}

module.exports = {
  addMetadataPage,
  postMetadataPage
}
