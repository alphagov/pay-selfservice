const { expect } = require('chai')
const { CredentialsForm, isNotEmpty } = require('./credentials-form')

describe('Credentials forms', () => {
  it('constructs a form with no fields', () => {
    const form = new CredentialsForm()
    expect(form).to.not.be.null // eslint-disable-line
    expect(form.validate().errors).to.deep.equal({})
  })

  it('correctly validates for empty values', () => {
    const form = new CredentialsForm([{
      id: 'some-id', valid: [{ method: isNotEmpty, message: 'Enter some ID' }]
    }])
    const results = form.validate({
      'some-id': ''
    })
    expect(results.errors['some-id']).to.equal('Enter some ID')
    expect(results.errorSummaryList[0]).to.have.keys('href', 'text')
    expect(results.errorSummaryList[0].href).to.equal('#some-id')
  })

  it('correctly validates for populated values', () => {
    const form = new CredentialsForm([{
      id: 'some-id', key: 'someId', valid: [{ method: isNotEmpty, message: 'Enter some ID' }]
    }])
    const results = form.validate({
      'some-id': 'some-value'
    })
    expect(results.values.someId).to.equal('some-value')
    expect(results.errors).to.deep.equal({})
    expect(results.errorSummaryList).to.have.length(0)
  })

  it('correctly validates multiple fields with multiple validators', () => {
    const form = new CredentialsForm([
      {
        id: 'some-id', key: 'someId', valid: [{ method: isNotEmpty, message: 'Enter some ID' }]
      },
      {
        id: 'some-thing', key: 'someThing', valid: [{ method: isNotEmpty, message: 'Enter some Thing' }]
      },
      {
        id: 'another-thing', key: 'anotherThing', valid: [{ method: isNotEmpty, message: 'Enter some other Thing' }]
      },
      {
        id: 'a-third-thing',
        key: 'aThirdThing',
        valid: [
          { method: isNotEmpty, message: 'Enter some third Thing' },
          { method: value => value === 'this-is-th-only-valid-value', message: 'Invalid value' }
        ]
      }
    ])
    const results = form.validate({
      'some-id': 'some-value',
      'some-thing': '',
      'another-thing': 'another-value',
      'a-third-thing': 'this-value-is-not-empty-but-will-be-invalid'
    })
    expect(results.values.someId).to.equal('some-value')
    expect(results.errors['some-thing']).to.equal('Enter some Thing')
    expect(results.errors['a-third-thing']).to.equal('Invalid value')
    expect(results.errorSummaryList[0]).to.have.keys('href', 'text')

    expect(results.errorSummaryList).to.have.length(2)
  })

  it('populates form values from an entity', () => {
    const form = new CredentialsForm([{
      id: 'someId', key: 'some_id'
    }])
    const results = form.from({ some_id: 'an-initial-id' })
    expect(results.values.some_id).to.equal('an-initial-id')
  })
})
