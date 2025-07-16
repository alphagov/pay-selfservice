import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import { getProductByExternalId, deleteProduct } from '@services/products.service'
import { penceToPoundsWithCurrency } from '@utils/currency-formatter'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { body, validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import { NextFunction } from 'client-sessions'

interface DeletePaymentLinkBody {
  confirmDelete?: 'yes' | 'no'
}

async function get(req: ServiceRequest, res: ServiceResponse) {
  const { productExternalId } = req.params
  const { service, account } = req

  const paymentLink = await getProductByExternalId(productExternalId)

  const backLinkUrl = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.paymentLinks.index,
    service.externalId,
    account.type
  )

  return response(req, res, 'simplified-account/services/payment-links/delete/index', {
    service,
    account,
    backLink: backLinkUrl,
    paymentLink: {
      externalId: paymentLink.externalId,
      name: paymentLink.name,
      description: paymentLink.description,
      formattedPrice: paymentLink.price ? penceToPoundsWithCurrency(paymentLink.price) : 'User can choose',
      referenceLabel: paymentLink.referenceEnabled ? paymentLink.referenceLabel : 'Created by GOV.UK Pay',
    },
  })
}

async function post(req: ServiceRequest<DeletePaymentLinkBody>, res: ServiceResponse, next: NextFunction) {
  const { productExternalId } = req.params
  const { service, account } = req

  const paymentLink = await getProductByExternalId(productExternalId)

  const validations = [
    body('confirmDelete')
      .trim()
      .notEmpty()
      .withMessage(`Confirm if you want to delete ${paymentLink.name}`)
      .bail()
      .isIn(['yes', 'no'])
      .withMessage('Select a valid option'),
  ]

  await Promise.all(validations.map((validation) => validation.run(req)))
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    const backLinkUrl = formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.index,
      service.externalId,
      account.type
    )
    return response(req, res, 'simplified-account/services/payment-links/delete/index', {
      service,
      account,
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      backLink: backLinkUrl,
      paymentLink: {
        externalId: paymentLink.externalId,
        name: paymentLink.name,
        description: paymentLink.description,
        formattedPrice: paymentLink.price ? penceToPoundsWithCurrency(paymentLink.price) : 'User can choose',
        referenceLabel: paymentLink.referenceEnabled ? paymentLink.referenceLabel : 'Created by GOV.UK Pay',
      },
    })
  }

  if (req.body.confirmDelete === 'no') {
    const redirectUrl = formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.index,
      service.externalId,
      account.type
    )
    return res.redirect(redirectUrl)
  }
  deleteProduct(account.id, productExternalId)
    .then(() => {
      req.flash('messages', {
              state: 'success',
              icon: '&check;',
              heading: `Successfully deleted ` + paymentLink.name,
            })
      res.redirect(
        formatServiceAndAccountPathsFor(paths.simplifiedAccount.paymentLinks.index, service.externalId, account.type)
      )
    })
    .catch((err: Error) => {
      next(err)
    })
}

export { get, post }
