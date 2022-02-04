function formatErrorsForSummaryList (errors = {}) {
  return Object.entries(errors).map(([id, message]) => ({
    href: `#${id}`,
    text: message
  }))
}
class CredentialsForm {
  constructor (fields = []) {
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
      values[field.key || field.id] = typeof formData[field.id] === 'string' ? formData[field.id].trim() : formData[field.id]
      valid.forEach((validator) => {
        const valid = validator.method(formData[field.id])
        if (!valid) {
          errors[field.id] = validator.message
        }
      })
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

module.exports = { CredentialsForm, isNotEmpty, formatErrorsForSummaryList }
