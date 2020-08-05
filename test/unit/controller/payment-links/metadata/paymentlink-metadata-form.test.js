const chai = require('chai')
const MetadataForm = require('./../../../../../app/controllers/payment-links/metadata/metadata-form')
const { expect } = chai

describe('Payment link metadata form model', () => {
  it('initialises with valid input', () => {
    const body = { 'metadata-column-header': 'key', 'metadata-cell-value': 'value' }
    const form = new MetadataForm(body)
    expect(form).to.not.be.null // eslint-disable-line
    expect(form.values['metadata-column-header']).to.eq('key')
    expect(form.values['metadata-cell-value']).to.eq('value')
  })

  it('correctly validates given invalid input', () => {
    const body = { 'metadata-column-header': '', 'metadata-cell-value': 'value' }
    const form = new MetadataForm(body)
    const tested = form.validate()

    expect(tested.errors.length).to.eq(1)
    expect(tested.errorMaps['metadata-column-header']).to.not.be.null // eslint-disable-line
    expect(tested.errorMaps['metadata-cell-value']).to.be.undefined // eslint-disable-line
  })

  it('correctly passes with all valid inputs', () => {
    const body = { 'metadata-column-header': 'key', 'metadata-cell-value': 'value' }
    const form = new MetadataForm(body)
    const tested = form.validate()

    expect(tested.errors.length).to.eq(0)
  })

  it('parses a known submission error correctly', () => {
    const body = { 'metadata-column-header': 'key', 'metadata-cell-value': 'value' }
    const error = { errorIdentifier: 'DUPLICATE_METADATA_KEYS' }
    const form = new MetadataForm(body)
    const submissionError = form.parseSubmissionError(error)

    expect(submissionError.field).to.eq(form.fields.metadataKey)
  })

  it('gets default error case if no known codes match', () => {
    const body = { 'metadata-column-header': 'key', 'metadata-cell-value': 'value' }
    const error = { }
    const form = new MetadataForm(body)
    const submissionError = form.parseSubmissionError(error)

    expect(submissionError.text).to.eq('Unknown problem with adding reporting column')
  })
})
