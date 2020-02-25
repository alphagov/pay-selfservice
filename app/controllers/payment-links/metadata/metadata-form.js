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
      console.log(field)
      field.validation.some((validationEntry) => {
        console.log(validationEntry, this.values[field.id])
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
}

function isNotEmpty (value) {
  return value && value.length !== 0
}

module.exports = MetadataForm
