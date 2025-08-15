import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { getProductByGatewayAccountIdAndExternalId, updateProduct } from '@services/products.service'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { ProductUpdateRequestBuilder } from '@models/products/ProductUpdateRequest.class'
import { paymentLinkSchema } from '@utils/simplified-account/validation/payment-link.schema'
import { validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'

async function get(req: ServiceRequest, res: ServiceResponse) {
  const product = await getProductByGatewayAccountIdAndExternalId(req.account.id, req.params.productExternalId)
  return response(req, res, 'simplified-account/services/payment-links/edit/reference', {
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.edit.index,
      req.service.externalId,
      req.account.type,
      product.externalId
    ),
    serviceMode: req.account.type,
    isWelsh: product.language === 'cy',
    formValues: {
      referenceTypeGroup: product.referenceEnabled ? 'custom' : 'standard',
      referenceLabel: product.referenceLabel,
      referenceHint: product.referenceHint,
    },
  })
}

interface EditLinkReferenceBody {
  referenceTypeGroup: 'custom' | 'standard'
  referenceLabel: string
  referenceHint: string
}

async function post(req: ServiceRequest<EditLinkReferenceBody>, res: ServiceResponse) {
  const product = await getProductByGatewayAccountIdAndExternalId(req.account.id, req.params.productExternalId)
  const validations = [paymentLinkSchema.reference.type.validate]

  if (req.body.referenceTypeGroup === 'custom') {
    validations.push(paymentLinkSchema.reference.label.validate, paymentLinkSchema.reference.hint.validate)
  }

  await Promise.all(validations.map((validation) => validation.run(req)))
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return response(req, res, 'simplified-account/services/payment-links/edit/reference', {
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
      formValues: req.body,
    })
  }

  const productUpdateRequest = ProductUpdateRequestBuilder.fromProduct(product)
    .setReference({
      enabled: req.body.referenceTypeGroup === 'custom',
      label: req.body.referenceLabel,
      hint: req.body.referenceHint,
    })
    .build()

  await updateProduct(req.account.id, product.externalId, productUpdateRequest)

  res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.edit.index,
      req.service.externalId,
      req.account.type,
      product.externalId
    )
  )
}

export { get, post }
