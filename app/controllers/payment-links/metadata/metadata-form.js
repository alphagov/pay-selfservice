const { constants } = require('@govuk-pay/pay-js-commons')

const {
  MAX_KEY_LENGTH,
  MAX_VALUE_LENGTH,
  MAX_KEY_VALUE_PAIRS } = constants.externalMetadata

const SPECIAL_CHARACTERS = [ '\\' ]
const fields = {
  metadataKey: {
    id: 'metadata-column-header',
    name: 'metadata-column-header',
    validation: [
      {
        validator: isNotEmpty,
        message: 'Enter a column header'
      },
      {
        validator: isValidLengthForColumnHeader,
        message: `Column header must be ${MAX_KEY_LENGTH} characters or fewer`
      },
      {
        validator: isNotDuplicate,
        message: 'Column header must not already exist'
      },
      {
        validator: isNotExceedingMaxNoOfReportingColumns,
        message: `Number of reporting columns must be ${MAX_KEY_VALUE_PAIRS} or fewer`
      },
      {
        validator: doesNotContainSpecialCharacters,
        message: `Column header must not include ${SPECIAL_CHARACTERS.join(' ')}`
      }
    ]
  },
  metadataValue: {
    id: 'metadata-cell-value',
    name: 'metadata-cell-value',
    validation: [
      {
        validator: isNotEmpty,
        message: 'Enter cell content'
      },
      {
        validator: isValidLengthForCellContent,
        message: `Cell content must be ${MAX_VALUE_LENGTH} characters or fewer`
      }
    ]
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
  constructor (formData = {}, existingMetadata = {}) {
    this.values = {}
    this.fields = fields
    this.values[fields.metadataKey.id] = formData[fields.metadataKey.name]
    this.values[fields.metadataValue.id] = formData[fields.metadataValue.name]
    this.existingMetadata = existingMetadata
  }

  // returns list of errors which may be on the form, both a map of ids to errors and a top level array
  validate () {
    const errors = []
    const errorMaps = {}
    for (const fieldKey in fields) {
      const field = fields[fieldKey]
      field.validation.some((validationEntry) => {
        const valid = validationEntry.validator(this.values[field.id], this.existingMetadata)
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

function isValidLengthForColumnHeader (value) {
  return value && value.length <= MAX_KEY_LENGTH
}

function isValidLengthForCellContent (value) {
  return value && value.length <= MAX_VALUE_LENGTH
}

function isNotDuplicate (value, existingMetadata) {
  if (existingMetadata) {
    const found = Object.keys(existingMetadata).find(metadataKey => String(value).toLowerCase() === String(metadataKey).toLowerCase())
    return !found
  }

  return true
}

function isNotExceedingMaxNoOfReportingColumns (value, existingMetadata) {
  if (Object.keys(existingMetadata) && Object.keys(existingMetadata).length >= MAX_KEY_VALUE_PAIRS) {
    return false
  }

  return true
}

function doesNotContainSpecialCharacters (value) {
  return !SPECIAL_CHARACTERS.some((character) => value.includes(character))
}

module.exports = MetadataForm
