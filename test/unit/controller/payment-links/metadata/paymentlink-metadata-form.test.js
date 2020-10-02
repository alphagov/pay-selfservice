const MetadataForm = require('./../../../../../app/controllers/payment-links/metadata/metadata-form')

describe('Payment link metadata form model', () => {
  it('initialises with valid input', () => {
    const body = { 'metadata-column-header': 'key', 'metadata-cell-value': 'value' }
    const form = new MetadataForm(body)
    expect(form).not.toBeNull() // eslint-disable-line
    expect(form.values['metadata-column-header']).toBe('key')
    expect(form.values['metadata-cell-value']).toBe('value')
  })

  it('correctly validates given invalid input', () => {
    const body = { 'metadata-column-header': '', 'metadata-cell-value': 'value' }
    const form = new MetadataForm(body)
    const tested = form.validate()

    expect(tested.errors.length).toBe(1)
    expect(tested.errorMaps['metadata-column-header']).not.toBeNull() // eslint-disable-line
    expect(tested.errorMaps['metadata-cell-value']).toBeUndefined() // eslint-disable-line
  })

  it('correctly passes with all valid inputs', () => {
    const body = { 'metadata-column-header': 'key', 'metadata-cell-value': 'value' }
    const form = new MetadataForm(body)
    const tested = form.validate()

    expect(tested.errors.length).toBe(0)
  })

  it('parses a known submission error correctly', () => {
    const body = { 'metadata-column-header': 'key', 'metadata-cell-value': 'value' }
    const error = { errorIdentifier: 'DUPLICATE_METADATA_KEYS' }
    const form = new MetadataForm(body)
    const submissionError = form.parseSubmissionError(error)

    expect(submissionError.field).toBe(form.fields.metadataKey)
  })

  it('gets default error case if no known codes match', () => {
    const body = { 'metadata-column-header': 'key', 'metadata-cell-value': 'value' }
    const error = { }
    const form = new MetadataForm(body)
    const submissionError = form.parseSubmissionError(error)

    expect(submissionError.text).toBe('Unknown problem with adding reporting column')
  })
})
