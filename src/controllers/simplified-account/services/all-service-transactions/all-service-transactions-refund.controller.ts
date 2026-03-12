import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { getTransaction } from '@services/transactions.service'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import { transactionRefundSchema } from '@utils/simplified-account/validation/transaction-refund.schema'
import { submitRefund } from '@services/charge.service'
import { ChargeRefundRequest } from '@models/charge/ChargeRefundRequest.class'
import { safeConvertPoundsStringToPence } from '@utils/currency-formatter'
import { Message } from '@utils/types/express/Message'
import { TITLE_FRIENDLY_DATE_TIME } from '@models/constants/time-formats'

async function get(req: ServiceRequest, res: ServiceResponse) {
  const transaction = await getTransaction(req.params.transactionExternalId, req.account.id)
  if (transaction.isFullyRefunded() || !transaction.isRefundable()) {
    return res.redirect(
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.transactions.detail,
        req.service.externalId,
        req.account.type,
        req.params.transactionExternalId
      )
    )
  }

  return response(req, res, 'simplified-account/services/transactions/refund', {
    transaction,
    pageID: `${transaction.createdDate.toFormat(TITLE_FRIENDLY_DATE_TIME)} - ${transaction.reference}`,
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.transactions.detail,
      req.service.externalId,
      req.account.type,
      req.params.transactionExternalId
    ),
  })
}

interface TransactionRefundBody {
  refundPayment: string
  partialRefundAmount: string
}

async function post(req: ServiceRequest<TransactionRefundBody>, res: ServiceResponse) {
  const transaction = await getTransaction(req.params.transactionExternalId, req.account.id)
  if (transaction.isFullyRefunded() || !transaction.isRefundable()) {
    return res.redirect(
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.transactions.detail,
        req.service.externalId,
        req.account.type,
        req.params.transactionExternalId
      )
    )
  }

  const validations = [
    transactionRefundSchema.refundPayment.validate,
    transactionRefundSchema.partialRefundAmount.validateForTransaction(transaction),
  ]
  await Promise.all(validations.map((validation) => validation.run(req)))

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return response(req, res, 'simplified-account/services/transactions/refund', {
      transaction,
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      backLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.transactions.detail,
        req.service.externalId,
        req.account.type,
        req.params.transactionExternalId
      ),
      partialSelected: req.body.refundPayment === 'partial',
      partialRefundAmount: req.body.partialRefundAmount,
    })
  }

  const refundAmount =
    req.body.refundPayment === 'full'
      ? transaction.refundSummary!.amountAvailable
      : safeConvertPoundsStringToPence(req.body.partialRefundAmount)
  if (refundAmount === undefined || refundAmount === null) {
    throw new Error(`Attempting to issue ${req.body.refundPayment} refund with undefined or null value`)
  }
  const refundAmountAvailable = transaction.refundSummary!.amountAvailable

  await submitRefund(
    req.service.externalId,
    req.account.type,
    req.params.transactionExternalId,
    new ChargeRefundRequest()
      .withAmount(refundAmount)
      .withRefundAmountAvailable(refundAmountAvailable)
      .withUserEmail(req.user.email)
      .withUserExternalId(req.user.externalId)
  )

  req.flash('messages', Message.Success('Refund successful', 'It may take up to six days to process.'))

  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.transactions.detail,
      req.service.externalId,
      req.account.type,
      req.params.transactionExternalId
    )
  )
}

export { get, post }
