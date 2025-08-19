import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { getProductByGatewayAccountIdAndExternalId, updateProduct } from '@services/products.service'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { penceToPounds, safeConvertPoundsStringToPence } from '@utils/currency-formatter'
import { ProductUpdateRequestBuilder } from '@models/products/ProductUpdateRequest.class'
import { paymentLinkSchema } from '@utils/simplified-account/validation/payment-link.schema'
import { validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'

async function get(req: ServiceRequest, res: ServiceResponse) {
  const product = await getProductByGatewayAccountIdAndExternalId(req.account.id, req.params.productExternalId)
  return response(req, res, 'simplified-account/services/payment-links/edit/amount', {
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.edit.index,
      req.service.externalId,
      req.account.type,
      product.externalId
    ),
    serviceMode: req.account.type,
    isWelsh: product.language === 'cy',
    formValues: {
      amountTypeGroup: product.price > 0 ? 'fixed' : 'variable',
      paymentAmount: product.price > 0 ? penceToPounds(product.price) : undefined,
      amountHint: product.amountHint,
    },
  })
}

interface EditLinkAmountBody {
  amountTypeGroup: 'fixed' | 'variable'
  paymentAmount: string
  amountHint: string
}

async function post(req: ServiceRequest<EditLinkAmountBody>, res: ServiceResponse) {
  const product = await getProductByGatewayAccountIdAndExternalId(req.account.id, req.params.productExternalId)

  const validations = [paymentLinkSchema.amount.type.validate]

  if (req.body.amountTypeGroup === 'fixed') {
    validations.push(paymentLinkSchema.amount.price.validate)
  } else {
    validations.push(paymentLinkSchema.amount.hint.validate)
  }

  await Promise.all(validations.map((validation) => validation.run(req)))
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return response(req, res, 'simplified-account/services/payment-links/edit/amount', {
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
    .setAmount({
      price: req.body.amountTypeGroup === 'fixed' ? safeConvertPoundsStringToPence(req.body.paymentAmount) : 0,
      hint: req.body.amountHint,
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
