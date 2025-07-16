import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import { body, validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { NextFunction } from 'express'
import formatAccountPathsFor from '@utils/format-account-paths-for'
import * as publicAuthClient from '@services/clients/public-auth.client'

interface CreatePaymentLinkBody {
  name?: string
  description?: string
  reference?: 'yes' | 'no'
  referenceLabel?: string
  referenceHint?: string
  amount?: string
  amountType?: 'fixed' | 'variable'
  amountHint?: string
}

interface CreateTokenResponse {
  token: string
}

interface CreateTokenPayload {
  accountId: number
  payload: {
    account_id: number
    created_by: string
    type: string
    description: string
    token_account_type: string
    service_external_id: string
    service_mode: string
  }
}

const validations = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Enter a payment link title')
    .bail()
    .isLength({ max: 230 })
    .withMessage('Title must be 230 characters or fewer'),

  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Details must be 255 characters or fewer'),

  body('reference')
    .optional()
    .isIn(['yes', 'no'])
    .withMessage('Select yes if you need to add a reference'),

  body('referenceLabel')
    .if(body('reference').equals('yes'))
    .trim()
    .notEmpty()
    .withMessage('Enter a name for your reference field')
    .bail()
    .isLength({ max: 50 })
    .withMessage('Reference field name must be 50 characters or fewer'),

  body('referenceHint')
    .optional({ checkFalsy: true })
    .if(body('reference').equals('yes'))
    .trim()
    .isLength({ max: 255 })
    .withMessage('Hint text must be 255 characters or fewer'),

  body('amountType')
    .notEmpty()
    .withMessage('Select if the payment amount is fixed or the user can choose')
    .bail()
    .isIn(['fixed', 'variable'])
    .withMessage('Select a valid amount type'),

  body('amount')
    .if(body('amountType').equals('fixed'))
    .trim()
    .notEmpty()
    .withMessage('Enter the payment amount')
    .bail()
    .matches(/^\d+(\.\d{0,2})?$/)
    .withMessage('Enter an amount in pounds and pence using digits and a decimal point. For example "10.50"')
    .bail()
    .custom((value) => {
      const amount = parseFloat(value as string)
      if (amount < 0.01) {
        throw new Error('Amount must be 1p or more')
      }
      if (amount > 100000) {
        throw new Error('Amount must be £100,000 or less')
      }
      return true
    }),

  body('amountHint')
    .optional({ checkFalsy: true })
    .if(body('amountType').equals('variable'))
    .trim()
    .isLength({ max: 255 })
    .withMessage('Hint text must be 255 characters or fewer'),
]

function get(req: ServiceRequest, res: ServiceResponse) {
  const { service, account } = req

  const backLinkUrl = formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.paymentLinks.index,
    service.externalId,
    account.type
  )

  return response(req, res, 'simplified-account/services/payment-links/create/index', {
    service,
    account,
    backLink: backLinkUrl,
    formValues: {},
  })
}

async function post(req: ServiceRequest, res: ServiceResponse, next: NextFunction) {
  const { service, account } = req
  const body: CreatePaymentLinkBody = req.body

  await Promise.all(validations.map((validation) => validation.run(req)))
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    const backLinkUrl = formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.index,
      service.externalId,
      account.type
    )

    return response(req, res, 'simplified-account/services/payment-links/create/index', {
      service,
      account,
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      backLink: backLinkUrl,
      formValues: body,
    })
  }

  try {
    const createTokenResponse = await (publicAuthClient as { createTokenForAccount: (payload: CreateTokenPayload) => Promise<CreateTokenResponse> }).createTokenForAccount({
      accountId: account.id,
      payload: {
        account_id: account.id,
        created_by: req.user.email,
        type: 'PRODUCTS',
        description: `Token for "${body.name ?? ''}" payment link`,
        token_account_type: account.type,
        service_external_id: service.externalId,
        service_mode: account.type
      }
    })

    const serviceNamePath = service.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50)

    const productNamePath = (body.name ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50)

    const sessionData: any = {
      paymentLinkTitle: body.name,
      paymentLinkDescription: body.description,
      serviceNamePath,
      productNamePath,
      isWelsh: false,
      payApiToken: createTokenResponse.token,
      gatewayAccountId: account.id
    }

    if (body.reference === 'yes') {
      sessionData.paymentReferenceType = 'custom'
      sessionData.paymentReferenceLabel = body.referenceLabel
      sessionData.paymentReferenceHint = body.referenceHint
    }

    if (body.amountType === 'fixed' && body.amount) {
      sessionData.paymentLinkAmount = Math.round(parseFloat(body.amount) * 100)
    } else if (body.amountType === 'variable') {
      sessionData.amountHint = body.amountHint
    }

    req.session.pageData = req.session.pageData || {}
    req.session.pageData.createPaymentLink = sessionData

    const redirectUrl = formatAccountPathsFor(
      paths.account.paymentLinks.review,
      account.externalId
    )
    return res.redirect(redirectUrl)
  } catch (error) {
    next(error)
  }
}

export { get, post }
