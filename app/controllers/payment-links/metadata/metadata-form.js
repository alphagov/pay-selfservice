const fields = {
  metadataKey: {
    id: 'metadata-column-header',
    name: 'metadata-column-header',
    validation: [ {
      validator: isNotEmpty,
      message: 'Enter a column header'
    } ]
  },
  metadataValue: {
    id: 'metadata-cell-value',
    name: 'metadata-cell-value',
    validation: [ {
      validator: isNotEmpty,
      message: 'Enter a cell value'
    } ]
  }
}

const submissionErrorCodes = {
  DUPLICATE_METADATA_KEYS: {
    field: fields.metadataKey,
    href: `#${fields.metadataKey.id}`,
    text: 'Column header must be unique for this payment link'
  }
}

const defaultFallbackError = {
  href: '#',
  text: 'Unknown problem with adding reporting column'
}

class MetadataForm {
  constructor (formData = {}) {
    this.values = {}
    this.fields = fields
    this.values[fields.metadataKey.id] = formData[fields.metadataKey.name]
    this.values[fields.metadataValue.id] = formData[fields.metadataValue.name]
  }

  // returns list of errors which may be on the form, both a map of ids to errors and a top level array
  validate () {
    const errors = []
    const errorMaps = {}
    for (const fieldKey in fields) {
      const field = fields[fieldKey]
      field.validation.some((validationEntry) => {
        const valid = validationEntry.validator(this.values[field.id])
        if (!valid) {
          errors.push({
            href: `#${field.id}`,
            text: validationEntry.message
          })
          errorMaps[field.id] = validationEntry.message
          return true
        }
        return false
      })
    }
    return {
      errors, errorMaps
    }
  }

  parseSubmissionError (error) {
    let parsedError
    Object.keys(submissionErrorCodes).some((key) => {
      const code = submissionErrorCodes[key]
      if (key === error.errorIdentifier) {
        parsedError = code
        return true
      }
      return false
    })
    return parsedError || defaultFallbackError
  }
}

function isNotEmpty (value) {
  return value && value.length !== 0
}

module.exports = MetadataForm
