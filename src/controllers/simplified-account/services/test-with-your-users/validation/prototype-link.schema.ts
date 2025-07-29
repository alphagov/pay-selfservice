import {body, Meta} from 'express-validator'
import {safeConvertPoundsStringToPence} from "@utils/currency-formatter";
import {ServiceRequest} from "@utils/types/express";

const MAX_DESCRIPTION_LENGTH = 230
const MAX_AMOUNT_IN_PENCE = 10000000


export interface CreatePrototypeLinkData {
  description: string
  amount: string
  parsedAmount: number
  confirmationPage: string
}

interface CreatePrototypeLinkMeta extends Meta {
  req: ServiceRequest<CreatePrototypeLinkData>
}

const prototypeLinkSchema = {
  description: body('description')
    .not().isEmpty().withMessage('Enter a description').bail()
    .isLength({max: MAX_DESCRIPTION_LENGTH}).withMessage('Description must be 230 characters or fewer'),
  amount: body('amount')
    .isCurrency().withMessage('Enter an amount in pounds and pence using digits and a decimal point. For example “10.50”').bail()
    .custom((value: string, { req }: CreatePrototypeLinkMeta) => {
      const parsedAmount = safeConvertPoundsStringToPence(value)
      if (parsedAmount === null) {
        return false
      }
      req.body.parsedAmount = parsedAmount
      return true
    }).withMessage('Enter an amount in pounds and pence using digits and a decimal point. For example “10.50”').bail()
    .custom((_, { req }: CreatePrototypeLinkMeta) => req.body.parsedAmount > 0).withMessage('Amount must be greater than 0').bail()
    .custom((_, { req }: CreatePrototypeLinkMeta) => req.body.parsedAmount < MAX_AMOUNT_IN_PENCE).withMessage('Amount must be less than £100,000').bail(),
  confirmationPage: body('confirmationPage')
    .isURL({
      protocols: ['https'],
      require_protocol: true
    }).withMessage('Enter a valid URL starting with https://')
}

export {
  prototypeLinkSchema
}
