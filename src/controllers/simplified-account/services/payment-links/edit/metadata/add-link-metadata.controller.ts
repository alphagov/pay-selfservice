import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { getProductByGatewayAccountIdAndExternalId, updateProduct } from '@services/products.service'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { paymentLinkSchema } from '@utils/simplified-account/validation/payment-link.schema'
import { validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import { ProductUpdateRequestBuilder } from '@models/products/ProductUpdateRequest.class'

async function get(req: ServiceRequest, res: ServiceResponse) {
  const product = await getProductByGatewayAccountIdAndExternalId(req.account.id, req.params.productExternalId)
  return response(req, res, 'simplified-account/services/payment-links/edit/metadata', {
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.edit.index,
      req.service.externalId,
      req.account.type,
      product.externalId
    ),
    serviceMode: req.account.type,
    isWelsh: product.language === 'cy',
    createJourney: true,
    productName: product.name,
  })
}

interface AddLinkMetadataBody {
  reportingColumn: string
  cellContent: string
}

async function post(req: ServiceRequest<AddLinkMetadataBody>, res: ServiceResponse) {
  const product = await getProductByGatewayAccountIdAndExternalId(req.account.id, req.params.productExternalId)

  const validations = [
    paymentLinkSchema.metadata.columnHeader.add.validate(product.metadata ?? {}),
    paymentLinkSchema.metadata.cellContent.validate,
  ]

  for (const validation of validations) {
    await validation.run(req)
  }

  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return response(req, res, 'simplified-account/services/payment-links/edit/metadata', {
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
      createJourney: true,
      formValues: req.body,
    })
  }

  const updatedMetadata = {
    ...product.metadata,
    [req.body.reportingColumn]: req.body.cellContent,
  }

  const productUpdateRequest = ProductUpdateRequestBuilder.fromProduct(product).setMetadata(updatedMetadata).build()

  await updateProduct(req.account.id, product.externalId, productUpdateRequest)

  req.flash('messages', {
    state: 'success',
    icon: '&check;',
    heading: 'Reporting column added',
  })

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
