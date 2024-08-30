const chai = require('chai')
const MetadataForm = require('./metadata-form')
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

  it('correctly validates given input that is too long', () => {
    const body = {
      'metadata-column-header': 'aaaaaaaaaabbbbbbbbbbcccccccccc1',
      'metadata-cell-value': 'aaaaaaaaaabbbbbbbbbbccccccccccddddddddddeeeeeeeeeeaaaaaaaaaabbbbbbbbbbccccccccccddddddddddeeeeeeeeee2'
    }

    const form = new MetadataForm(body)
    const tested = form.validate()

    expect(tested.errors.length).to.eq(2)
    expect(tested.errorMaps['metadata-column-header']).to.not.be.null // eslint-disable-line
    expect(tested.errorMaps['metadata-cell-value']).to.not.be.null // eslint-disable-line
  })

  it('correctly validates a duplicate metadata column', () => {
    const body = {
      'metadata-column-header': 'test 2 header',
      'metadata-cell-value': 'test 2 value'
    }

    const existingMetadata = {
      'test 1 header': 'test 1 value',
      'test 2 header': 'test 2 value'
    }

    const form = new MetadataForm(body, existingMetadata)
    const tested = form.validate()
    expect(tested.errors.length).to.eq(1)
    expect(tested.errorMaps['metadata-column-header']).to.not.be.null // eslint-disable-line
    expect(tested.errorMaps['metadata-cell-value']).to.be.undefined // eslint-disable-line
  })

  it('correctly validates case insensitive duplicate keys', () => {
    const newMetadata = {
      'metadata-column-header': 'DuPlicAte-Key',
      'metadata-cell-value': 'a-value'
    }

    const existingMetadata = {
      'duplicate-key': 'a-value'
    }

    const form = new MetadataForm(newMetadata, existingMetadata)
    const tested = form.validate()
    expect(tested.errors.length).to.eq(1)
    expect(tested.errorMaps['metadata-column-header']).to.include('Column header must not already exist') // eslint-disable-line
  })

  it('correctly validates when the number of metadata columns exceeds the max number of allowed metadata columns', () => {
    const body = {
      'metadata-column-header': 'test 16 header',
      'metadata-cell-value': 'test 16 value'
    }

    const existingMetadata = {
      'test 1 header': 'test 1 value',
      'test 2 header': 'test 2 value',
      'test 3 header': 'test 3 value',
      'test 4 header': 'test 4 value',
      'test 5 header': 'test 5 value',
      'test 6 header': 'test 6 value',
      'test 7 header': 'test 7 value',
      'test 8 header': 'test 8 value',
      'test 9 header': 'test 9 value',
      'test 10 header': 'test 10 value',
      'test 11 header': 'test 10 value',
      'test 12 header': 'test 10 value',
      'test 13 header': 'test 10 value',
      'test 14 header': 'test 10 value',
      'test 15 header': 'test 10 value'
    }

    const form = new MetadataForm(body, existingMetadata)
    const tested = form.validate()
    expect(tested.errors.length).to.eq(1)
    expect(tested.errorMaps['metadata-column-header']).to.not.be.null // eslint-disable-line
    expect(tested.errorMaps['metadata-cell-value']).to.be.undefined // eslint-disable-line
  })

  it('correctly validates when special characters are used for the header', () => {
    const body = { 'metadata-column-header': 'key1\\', 'metadata-cell-value': 'value' }
    const form = new MetadataForm(body)
    const tested = form.validate()

    expect(tested.errors.length).to.eq(1)
    expect(tested.errorMaps['metadata-column-header']).to.contain('Column header must not include')
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
