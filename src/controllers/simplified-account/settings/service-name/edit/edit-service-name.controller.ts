import type ServiceRequest from '@utils/types/express/ServiceRequest'
import type ServiceResponse from '@utils/types/express/ServiceResponse'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { response } from '@utils/response'
import { body, validationResult } from 'express-validator'
import { SERVICE_NAME_MAX_LENGTH } from '@utils/validation/server-side-form-validations'
import { updateServiceName } from '@services/service.service'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'

function get(req: ServiceRequest, res: ServiceResponse) {
  const editCy = req.query.cy === 'true'
  const context = {
    editCy,
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.serviceName.index,
      req.service.externalId,
      req.account.type
    ),
    submitLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.serviceName.edit,
      req.service.externalId,
      req.account.type
    ),
    removeCyLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.serviceName.removeCy,
      req.service.externalId,
      req.account.type
    ),
  }
  if (editCy) {
    Object.assign(context, { serviceName: req.service.serviceName.cy })
  } else {
    Object.assign(context, { serviceName: req.service.serviceName.en })
  }
  return response(req, res, 'simplified-account/settings/service-name/edit-service-name', context)
}

interface EditServiceNameBody {
  serviceName: string
  cy: string
}

async function post(req: ServiceRequest<EditServiceNameBody>, res: ServiceResponse) {
  const editCy = req.body.cy === 'true'
  const validations = [
    body('serviceName')
      .trim()
      .isLength({ max: SERVICE_NAME_MAX_LENGTH })
      .withMessage(`Service name must be ${SERVICE_NAME_MAX_LENGTH} characters or fewer`),
  ]
  // we don't check presence for welsh names
  if (!editCy) {
    validations.push(body('serviceName').trim().notEmpty().withMessage('Service name is required'))
  }

  await Promise.all(validations.map((validation) => validation.run(req)))
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return response(req, res, 'simplified-account/settings/service-name/edit-service-name', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      editCy,
      serviceName: req.body.serviceName,
      backLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.serviceName.index,
        req.service.externalId,
        req.account.type
      ),
      submitLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.serviceName.edit,
        req.service.externalId,
        req.account.type
      ),
      removeCyLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.serviceName.removeCy,
        req.service.externalId,
        req.account.type
      ),
    })
  }

  const newServiceName = req.body.serviceName.trim()
  if (editCy) {
    await updateServiceName(req.service.externalId, req.service.serviceName.en, newServiceName)
  } else {
    await updateServiceName(req.service.externalId, newServiceName, req.service.serviceName.cy)
  }
  res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.serviceName.index,
      req.service.externalId,
      req.account.type
    )
  )
}

export = {
  get,
  post,
}
