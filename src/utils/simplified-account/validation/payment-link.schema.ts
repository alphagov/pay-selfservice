import { body } from 'express-validator'

const paymentLinkSchema = {
  info: {
    title : {
      validate: body('name')
        .trim()
        .notEmpty()
        .withMessage('Enter a title')
        .bail()
        .isLength({ max: 255 })
        .withMessage('Title must 255 characters or fewer'),
    },
    details : {
      validate: body('description')
        .optional({ values: 'falsy' })
        .trim()
        .isLength({ min: 0, max: 5000 })
        .withMessage('Details must be less than 5000 characters')
        .matches(/^[^<>|]*$/) // no '<' or '>' or '|' characters
        .withMessage('Details contains invalid characters')
    }
  },
  reference: {
    type: {
      validate: body('referenceTypeGroup')
        .trim()
        .notEmpty()
        .withMessage('Please select an option')
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
      validate: body('hint')
        .optional({ values: 'falsy' })
        .trim()
        .isLength({ max: 255 })
        .withMessage('Hint text must be be 255 characters or fewer'),
    }
  }
}

export { paymentLinkSchema }
