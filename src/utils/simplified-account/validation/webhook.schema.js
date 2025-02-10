const { body } = require('express-validator')

const WEBHOOK_DESCRIPTION_MAX_LENGTH = 50

const webhookSchema = {
  callbackUrl: {
    validate: body('callbackUrl').trim()
      .notEmpty()
      .withMessage('Enter a callback url')
      .bail()
      .isURL({ protocols: ['https'], require_protocol: true, validate_length: true })
      .withMessage('Enter a valid callback url beginning with https://')

  },
  description: {
    validate: body('description').trim()
      .notEmpty()
      .withMessage('Enter a description')
      .bail()
      .isLength({ max: WEBHOOK_DESCRIPTION_MAX_LENGTH })
      .withMessage(`Description must be ${WEBHOOK_DESCRIPTION_MAX_LENGTH} characters or fewer`)
  },
  subscriptions: {
    validate: body('subscriptions')
      .notEmpty()
      .withMessage('Select at least one payment event')
  }
}

// errors returned by pay-webhooks
const webhookErrorIdentifiers = {
  CALLBACK_URL_MALFORMED: 'Enter a valid callback URL',
  CALLBACK_URL_PROTOCOL_NOT_SUPPORTED: 'Callback URL must begin with https://',
  CALLBACK_URL_NOT_ON_ALLOW_LIST: 'Callback URL must be approved. Please contact support'
}

module.exports = {
  webhookSchema,
  webhookErrorIdentifiers
}
