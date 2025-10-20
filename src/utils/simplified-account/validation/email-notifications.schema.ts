import { body } from 'express-validator'

const CUSTOM_PARAGRAPH_MAX_LENGTH = 5000

const emailNotificationsSchema = {
  emailCollectionMode: {
    validate: body('emailCollectionMode').isIn(['MANDATORY', 'OPTIONAL', 'OFF']).withMessage('Select an option'),
  },
  paymentConfirmationEmailToggle: {
    validate: body('paymentConfirmationEmailToggle').isIn(['true', 'false']).withMessage('Select an option'),
  },
  refundEmailToggle: {
    validate: body('refundEmailToggle').isIn(['true', 'false']).withMessage('Select an option'),
  },
  customParagraph: {
    validate: body('customParagraph')
      .trim()
      .isLength({ max: CUSTOM_PARAGRAPH_MAX_LENGTH })
      .withMessage(`Custom paragraph name must be ${CUSTOM_PARAGRAPH_MAX_LENGTH} characters or fewer`),
  },
}

export { emailNotificationsSchema }
