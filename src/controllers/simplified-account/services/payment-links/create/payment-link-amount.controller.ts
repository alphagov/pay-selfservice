import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import { CREATE_SESSION_KEY, PaymentLinkCreationSession } from './constants'
import lodash from 'lodash'
import { paymentLinkSchema } from '@utils/simplified-account/validation/payment-link.schema'
import { validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import formatAccountPathsFor from '@utils/format-account-paths-for'
import { safeConvertPoundsStringToPence } from '@utils/currency-formatter'


function get(req: ServiceRequest, res: ServiceResponse) {
  const { service, account } = req
  const currentSession = lodash.get(req, CREATE_SESSION_KEY, {} as PaymentLinkCreationSession)
  if (lodash.isEmpty(currentSession)) {
    return res.redirect(
      formatServiceAndAccountPathsFor(paths.simplifiedAccount.paymentLinks.index, service.externalId, account.type)
    )
  }
  const isWelsh = currentSession.language === 'cy'

  const formValues = {
    paymentAmountType: currentSession.paymentAmountType,
    ...(currentSession.paymentAmountType === 'fixed' && {
      paymentAmount: currentSession.paymentLinkAmount,
    }),
    ...(currentSession.paymentAmountType === 'variable' && {
      amountHint: currentSession.paymentReferenceHint,
    }),
  };

      // amountTypeGroup: 'fixed',
    // paymentAmount: currentSession.paymentLinkAmount ? poundsToPence(currentSession.paymentLinkAmount) : undefined,

  return response(req, res, 'simplified-account/services/payment-links/create/amount', {
    service,
    account,
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.reference,
      service.externalId,
      account.type
    ),
    formValues,
    isWelsh,
    serviceMode: account.type,
  })
}

interface CreateLinkAmountBody {
  amountTypeGroup: 'fixed' | 'variable'
  paymentAmount: string
  amountHint: string
}

async function post(req: ServiceRequest<CreateLinkAmountBody>, res: ServiceResponse) {
  const { service, account } = req
  const currentSession = lodash.get(req, CREATE_SESSION_KEY, {} as PaymentLinkCreationSession)
  if (lodash.isEmpty(currentSession)) {
    return res.redirect(
      formatServiceAndAccountPathsFor(paths.simplifiedAccount.paymentLinks.index, service.externalId, account.type)
    )
  }
  const isWelsh = currentSession.language === 'cy'

  const validations = [paymentLinkSchema.amount.type.validate]
  validations.push(paymentLinkSchema.amount.price.validate)

  // if (req.body.amountTypeGroup === 'fixed') {
  //   validations.push(paymentLinkSchema.amount.price.validate)
  // } else {
  //   validations.push(paymentLinkSchema.amount.hint.validate)
  // }

  await Promise.all(validations.map((validation) => validation.run(req)))
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    const backLinkUrl = formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.reference,
      service.externalId,
      account.type
    )

    return response(req, res, 'simplified-account/services/payment-links/create/amount', {
      service,
      account,
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      backLink: backLinkUrl,
      formValues: req.body,
      isWelsh,
      serviceMode: account.type,
      createJourney: true
    })
  }

  lodash.set(req, CREATE_SESSION_KEY, {
      ...lodash.get(req, CREATE_SESSION_KEY, {}),
      paymentLinkAmount: safeConvertPoundsStringToPence(req.body.paymentAmount),
    } as PaymentLinkCreationSession)
    return res.redirect(formatAccountPathsFor(paths.account.paymentLinks.review, account.externalId) as string)
}

export { get, post }