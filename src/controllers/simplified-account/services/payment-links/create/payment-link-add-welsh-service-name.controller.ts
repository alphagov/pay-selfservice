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
  const context = {
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.index,
      req.service.externalId,
      req.account.type
    ),
    submitLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.addWelshServiceName,
      req.service.externalId,
      req.account.type
    ),
    createWelshPaymentLinkLinkWithEnglishServiceName:
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.paymentLinks.create,
        req.service.externalId,
        req.account.type
      ) + '?language=cy&useEnglishServiceName=true',
    serviceMode: req.account.type,
  }

  Object.assign(context, { serviceName: req.service.serviceName.cy })
  return response(req, res, 'simplified-account/services/payment-links/create/add-welsh-service-name', context)
}

interface EditServiceNameBody {
  serviceName: string
}

async function post(req: ServiceRequest<EditServiceNameBody>, res: ServiceResponse) {
  const validations = [
    body('serviceName')
      .trim()
      .isLength({ max: SERVICE_NAME_MAX_LENGTH })
      .withMessage(`Service name must be ${SERVICE_NAME_MAX_LENGTH} characters or fewer`)
      .notEmpty()
      .withMessage('Enter a Welsh service name (Cymraeg)'),
  ]

  await Promise.all(validations.map((validation) => validation.run(req)))
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return response(req, res, 'simplified-account/services/payment-links/create/add-welsh-service-name.njk', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      serviceName: req.body.serviceName,
      backLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.paymentLinks.index,
        req.service.externalId,
        req.account.type
      ),
      submitLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.paymentLinks.addWelshServiceName,
        req.service.externalId,
        req.account.type
      ),
      createWelshPaymentLinkLinkWithEnglishServiceName:
        formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.paymentLinks.create,
          req.service.externalId,
          req.account.type
        ) + '?language=cy&useEnglishServiceName=true',
    })
  }

  const newServiceName = req.body.serviceName.trim()
  await updateServiceName(req.service.externalId, req.service.serviceName.en, newServiceName)

  res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.create + '?language=cy',
      req.service.externalId,
      req.account.type
    )
  )
}

export { get, post }
