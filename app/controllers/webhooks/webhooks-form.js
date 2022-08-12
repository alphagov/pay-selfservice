const CALLBACK_URL_MAX_LENGTH = 2048

const defaultFieldsSchema = [
  {
    id: 'callback_url',
    valid: [
      { method: isNotEmpty, message: 'Enter a callback URL' },
      { method: isValidLength, message: `Callback URL must be ${CALLBACK_URL_MAX_LENGTH} or fewer` }
    ],

    // https://github.com/alphagov/pay-webhooks/blob/main/src/main/java/uk/gov/pay/webhooks/webhook/exception/WebhooksErrorIdentifier.java
    errorIdentifiers: {
      CALLBACK_URL_MALFORMED: 'Callback URL must be a valid URL',
      CALLBACK_URL_PROTOCOL_NOT_SUPPORTED: 'Callback URL must use the protocol HTTPS',
      CALLBACK_URL_NOT_ON_ALLOW_LIST: 'Callback URL must be on an approved list of domains for live accounts. PLease contact support'
    }
  },
  {
    id: 'description'
  },
  {
    id: 'subscriptions',
    valid: [{ method: isNotEmpty, message: 'Select a payment event' }]
  }
]

class WebhooksForm {
  constructor (fields = defaultFieldsSchema) {
    this.fields = fields
    this.values = {}
  }

  from (entity = {}) {
    const values = this.fields.reduce((aggregate, field) => {
      const key = field.key || field.id
      aggregate[key] = entity[key]
      return aggregate
    }, {})
    return { values }
  }

  validate (formData = {}) {
    const errors = {}
    const values = {}

    this.fields.forEach((field) => {
      const valid = field.valid || []
      values[field.key || field.id] = trim(formData[field.id])
      valid.some((validator) => {
        const valid = validator.method(formData[field.id])
        if (!valid) {
          errors[field.id] = validator.message
          return true
        }
      })
    })
    return {
      values,
      errors,
      errorSummaryList: formatErrorsForSummaryList(errors)
    }
  }

  parseResponse (error = {}, formData = {}) {
    const errors = {}
    const values = {}
    this.fields.forEach((field) => {
      const fieldSpecificErrorIdentifiers = field.errorIdentifiers || {}
      const errorIdentifierValue = fieldSpecificErrorIdentifiers[error.errorIdentifier || error.error_identifier]
      values[field.key || field.id] = trim(formData[field.id])

      if (errorIdentifierValue) {
        errors[field.id] = errorIdentifierValue
      }
    })
    return {
      values,
      errors,
      errorSummaryList: formatErrorsForSummaryList(errors)
    }
  }
}

function isNotEmpty (value) {
  return value && value.length !== 0
}

function isValidLength (value) {
  return value && value.length <= CALLBACK_URL_MAX_LENGTH
}

function formatErrorsForSummaryList (errors = {}) {
  return Object.entries(errors).map(([id, message]) => ({
    href: `#${id}`,
    text: message
  }))
}

function trim (value) {
  return typeof value === 'string' ? value.trim() : value
}

module.exports = { WebhooksForm }
