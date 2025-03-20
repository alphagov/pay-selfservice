const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { response } = require('@utils/response')
const { body, validationResult } = require('express-validator')
const { SERVICE_NAME_MAX_LENGTH } = require('@utils/validation/server-side-form-validations')
const formatValidationErrors = require('@utils/simplified-account/format/format-validation-errors')
const { updateServiceName } = require('@services/service.service')

function get (req, res) {
  const editCy = req.query.cy === 'true'
  const context = {
    editCy,
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.index, req.service.externalId, req.account.type),
    submitLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.edit, req.service.externalId, req.account.type),
    removeCyLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.removeCy, req.service.externalId, req.account.type)
  }
  if (editCy) {
    Object.assign(context, { serviceName: req.service.serviceName.cy })
  } else {
    Object.assign(context, { serviceName: req.service.serviceName.en })
  }
  return response(req, res, 'simplified-account/settings/service-name/edit-service-name', context)
}

async function post (req, res) {
  const editCy = req.body.cy === 'true'
  const validations = [
    body('serviceName').trim().isLength({ max: SERVICE_NAME_MAX_LENGTH }).withMessage(`Service name must be ${SERVICE_NAME_MAX_LENGTH} characters or fewer`)
  ]
  // we don't check presence for welsh names
  if (!editCy) {
    validations.push(body('serviceName').trim().notEmpty().withMessage('Service name is required'))
  }

  await Promise.all(validations.map(validation => validation.run(req)))
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return response(req, res, 'simplified-account/settings/service-name/edit-service-name', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors
      },
      editCy,
      serviceName: req.body.serviceName,
      backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.index, req.service.externalId, req.account.type),
      submitLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.edit, req.service.externalId, req.account.type),
      removeCyLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.removeCy, req.service.externalId, req.account.type)
    })
  }

  const newServiceName = req.body.serviceName.trim()
  editCy ? await updateServiceName(req.service.externalId, req.service.serviceName.en, newServiceName) : await updateServiceName(req.service.externalId, newServiceName, req.service.serviceName.cy)
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.index, req.service.externalId, req.account.type))
}

module.exports = {
  get,
  post
}
