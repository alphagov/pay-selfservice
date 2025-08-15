import { response } from '@utils/response'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { getProductByGatewayAccountIdAndExternalId, updateProduct } from '@services/products.service'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { ProductUpdateRequestBuilder } from '@models/products/ProductUpdateRequest.class'
import { paymentLinkSchema } from '@utils/simplified-account/validation/payment-link.schema'
import { validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'

async function get (req: ServiceRequest, res: ServiceResponse) {
  const product = await getProductByGatewayAccountIdAndExternalId(req.account.id, req.params.productExternalId)
  return response(req, res, 'simplified-account/services/payment-links/edit/info', {
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.edit.index,
      req.service.externalId,
      req.account.type,
      product.externalId
    ),
    serviceMode: req.account.type,
    isWelsh: product.language === 'cy',
    formValues: {
      name: product.name,
      description: product.description,
    },
  })
}

interface EditLinkDetailsBody {
  name: string
  description: string
}

async function post (req: ServiceRequest<EditLinkDetailsBody>, res: ServiceResponse) {
  const product = await getProductByGatewayAccountIdAndExternalId(req.account.id, req.params.productExternalId)

  const validations = [
    paymentLinkSchema.info.name.validate,
    paymentLinkSchema.info.description.validate,
  ]

  await Promise.all(validations.map((validation) => validation.run(req)))
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return response(req, res, 'simplified-account/services/payment-links/edit/info', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      backLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.paymentLinks.edit.index,
        req.service.externalId,
        req.account.type,
        product.externalId
      ),
      serviceMode: req.account.type,
      isWelsh: product.language === 'cy',
      formValues: {
        name: req.body.name,
        description: req.body.description,
      },
    })
  }

  const productUpdateRequest = ProductUpdateRequestBuilder
    .fromProduct(product)
    .setName(req.body.name)
    .setDescription(req.body.description)
    .build()

  await updateProduct(req.account.id, product.externalId, productUpdateRequest)

  res.redirect(formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.paymentLinks.edit.index,
    req.service.externalId,
    req.account.type,
    product.externalId
  ))
}

export {
  get,
  post
}
