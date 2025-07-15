import { body } from 'express-validator'

const validatePaymentLinkTitle = () => {
  return body('name')
    .trim()
    .notEmpty()
    .withMessage('Enter a payment link title')
    .bail()
    .isLength({ max: 230 })
    .withMessage('Title must be 230 characters or fewer')
}

const validatePaymentLinkDescription = () => {
  return body('description')
    .trim()
    .optional({ checkFalsy: true })
    .isLength({ max: 255 })
    .withMessage('Details must be 255 characters or fewer')
}

const validatePaymentLinkReference = () => {
  return body('reference')
    .notEmpty()
    .withMessage('Select whether your users already have a payment reference')
}

const validatePaymentLinkReferenceLabel = () => {
  return body('referenceLabel')
    .trim()
    .if(body('reference').equals('yes'))
    .notEmpty()
    .withMessage('Enter a name for the payment reference')
    .bail()
    .isLength({ max: 255 })
    .withMessage('Payment reference name must be 255 characters or fewer')
}

const validatePaymentLinkReferenceHint = () => {
  return body('referenceHint')
    .trim()
    .optional({ checkFalsy: true })
    .isLength({ max: 255 })
    .withMessage('Reference hint must be 255 characters or fewer')
}

const validatePaymentLinkInformation = () => {
  return [
    validatePaymentLinkTitle(),
    validatePaymentLinkDescription()
  ]
}

const validatePaymentLinkReferenceDetails = () => {
  return [
    validatePaymentLinkReference(),
    validatePaymentLinkReferenceLabel(),
    validatePaymentLinkReferenceHint()
  ]
}

export {
  validatePaymentLinkTitle,
  validatePaymentLinkDescription,
  validatePaymentLinkReference,
  validatePaymentLinkReferenceLabel,
  validatePaymentLinkReferenceHint,
  validatePaymentLinkInformation,
  validatePaymentLinkReferenceDetails
}
