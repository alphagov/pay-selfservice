import { body } from 'express-validator'
import { demoPaymentSchema } from '@utils/simplified-account/validation/demo-payment.schema'
import { getProductByServiceAndProductPath } from '@services/products.service'
import slugifyString from '@utils/simplified-account/format/slugify-string'
import lodash from 'lodash'
import {
  CREATE_SESSION_KEY,
  PaymentLinkCreationSession,
} from '@controllers/simplified-account/services/payment-links/create/constants'

const paymentLinkSchema = {
  info: {
    name: {
      validate: body('name')
        .trim()
        .notEmpty()
        .withMessage('Enter a title')
        .bail()
        .isLength({ max: 230 })
        .withMessage('Title must be 230 characters or fewer'),
    },
    description: {
      validate: body('description')
        .optional({ values: 'falsy' })
        .trim()
        .isLength({ min: 0, max: 5000 })
        .withMessage('Details must be less than 5000 characters')
        .matches(/^[^<>|]*$/) // no '<' or '>' or '|' characters
        .withMessage('Details contains invalid characters'),
    },
  },
  existing: {
    paymentLink: {
      validate: body('paymentLink')
        .trim()
        .notEmpty()
        .withMessage('Enter a payment link address')
        .bail()
        .isLength({ max: 230 })
        .withMessage('a payment link address must be 230 characters or fewer')
        .custom(async (value, { req }) => {
          const currentSession = lodash.get(req, CREATE_SESSION_KEY, {}) as PaymentLinkCreationSession
          let result
          try {
            result = await getProductByServiceAndProductPath(
              String(currentSession.serviceNamePath),
              slugifyString(String(value))
            )
          } catch {
            return true
          }
          if (result) {
            throw new Error()
          }
        })
        .withMessage('The website address is already taken'),
    },
  },
  reference: {
    type: {
      validate: body('referenceTypeGroup')
        .trim()
        .notEmpty()
        .withMessage('Please select an option')
        .bail()
        .isIn(['custom', 'standard'])
        .withMessage('Please select an option'),
    },
    label: {
      validate: body('referenceLabel')
        .trim()
        .notEmpty()
        .withMessage('Please enter a reference')
        .isLength({ max: 50 })
        .withMessage('Reference must be be 50 characters or fewer'),
    },
    hint: {
      validate: body('referenceHint')
        .optional({ values: 'falsy' })
        .trim()
        .isLength({ max: 255 })
        .withMessage('Hint text must be be 255 characters or fewer'),
    },
  },
  amount: {
    type: {
      validate: body('amountTypeGroup')
        .trim()
        .notEmpty()
        .withMessage('Please select an option')
        .bail()
        .isIn(['fixed', 'variable'])
        .withMessage('Please select an option'),
    },
    price: {
      validate: demoPaymentSchema.paymentAmount.validate,
    },
    hint: {
      validate: body('amountHint')
        .optional({ values: 'falsy' })
        .trim()
        .isLength({ max: 255 })
        .withMessage('Hint text must be be 255 characters or fewer'),
    },
  },
  metadata: {
    columnHeader: {
      add: {
        validate: (currentMetadata: Record<string, string>) => metadataColumnHeaderValidator(currentMetadata).forAdd(),
      },
      edit: {
        validate: (currentMetadata: Record<string, string>, editKey: string) =>
          metadataColumnHeaderValidator(currentMetadata).forEdit(editKey),
      },
    },
    cellContent: {
      validate: body('cellContent')
        .trim()
        .notEmpty()
        .withMessage('Enter the cell content')
        .bail()
        .isLength({ min: 1, max: 100 })
        .withMessage('Cell content must be 100 characters or fewer'),
    },
  },
}

const metadataColumnHeaderValidator = (currentMetadata: Record<string, string>) => {
  const baseValidation = body('reportingColumn')
    .trim()
    .notEmpty()
    .withMessage('Enter the column header')
    .bail()
    .isLength({ min: 1, max: 30 })
    .withMessage('Column header must be 30 characters or fewer')
    .bail()

  return {
    forAdd: () =>
      baseValidation
        .custom((value: string) => {
          return !Object.keys(currentMetadata).includes(value)
        })
        .withMessage('Column header must not already exist')
        .bail()
        .custom(() => {
          return Object.keys(currentMetadata).length < 15
        })
        .withMessage('You have already set 15 reporting columns for this payment link, remove one to set another')
        .bail(),
    forEdit: (editKey: string) =>
      baseValidation
        .custom((value: string) => {
          return !(Object.keys(currentMetadata).includes(value) && value !== editKey)
        })
        .withMessage('Column header must not already exist')
        .bail(),
  }
}

export { paymentLinkSchema }
