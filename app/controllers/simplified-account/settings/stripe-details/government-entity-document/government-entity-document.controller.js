const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const { response } = require('@utils/response')
const paths = require('@root/paths')
const { GOV_ENTITY_DOC_FORM_FIELD_NAME } = require('@controllers/simplified-account/settings/stripe-details/government-entity-document/constants')
const { validationResult, check } = require('express-validator')
const { formatValidationErrors } = require('@utils/simplified-account/format')
const { updateStripeDetailsUploadEntityDocument } = require('@services/stripe-details.service')
const { checkTaskCompletion } = require('@middleware/simplified-account')
const { stripeDetailsTasks } = require('@utils/simplified-account/settings/stripe-details/tasks')

async function get (req, res) {
  return response(req, res, 'simplified-account/settings/stripe-details/government-entity-document/index', {
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, req.service.externalId, req.account.type),
    uploadField: GOV_ENTITY_DOC_FORM_FIELD_NAME
  })
}

async function post (req, res, next) {
  const validations = [
    check(GOV_ENTITY_DOC_FORM_FIELD_NAME)
      .custom(async (value, { req }) => {
        const file = req.file
        if (!file) {
          throw new Error('Select a file to upload')
        }
        const maxSize = 10 * 1024 * 1024 // 10MB
        if (file.size > maxSize) {
          throw new Error('File size must be less than 10MB')
        }
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
        if (!allowedTypes.includes(file.mimetype)) {
          throw new Error('File type must be PDF, JPG or PNG')
        }
        return true
      })
  ]
  await Promise.all(validations.map(validation => validation.run(req)))
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return postErrorResponse(req, res, {
      summary: formattedErrors.errorSummary,
      formErrors: formattedErrors.formErrors
    })
  }
  try {
    const file = req.file
    await updateStripeDetailsUploadEntityDocument(req.service, req.account, file)
  } catch (err) {
    if (err.type === 'StripeInvalidRequestError' && err.param === 'file') {
      return postErrorResponse(req, res, {
        summary: [{ text: 'Error uploading file to stripe. Try uploading a file with one of the following types: pdf, jpeg, png', href: '#government-entity-document' }]
      })
    }
    next(err)
  }
  req.flash('messages', { state: 'success', icon: '&check;', heading: 'Service connected to Stripe', body: 'This service can now take payments' })
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, req.service.externalId, req.account.type))
}

const postErrorResponse = (req, res, errors) => {
  return response(req, res, 'simplified-account/settings/stripe-details/government-entity-document/index', {
    errors,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.stripeDetails.index, req.service.externalId, req.account.type),
    uploadField: GOV_ENTITY_DOC_FORM_FIELD_NAME
  })
}

module.exports = {
  get: [checkTaskCompletion(stripeDetailsTasks.governmentEntityDocument.name), get],
  post: [checkTaskCompletion(stripeDetailsTasks.governmentEntityDocument.name), post]
}
