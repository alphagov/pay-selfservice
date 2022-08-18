const { expect } = require('chai')

const { WebhooksForm } = require('./webhooks-form')

const webhooksFixtures = require('./../../../test/fixtures/webhooks.fixtures')

describe('Webhooks forms', () => {
  it('constructs a form with no fields', () => {
    const formSchema = new WebhooksForm([])
    expect(formSchema).to.not.be.null // eslint-disable-line
    expect(formSchema.validate().errors).to.deep.equal({})
  })

  it('correctly validates for empty values', () => {
    const validDefaultSchemaForm = new WebhooksForm()

    // no selected radio elements will have no value
    const formData = {
      'callback_url': ''
    }
    const results = validDefaultSchemaForm.validate(formData)
    expect(results.errors['callback_url']).to.equal('Enter a callback URL')
    expect(results.errors['subscriptions']).to.equal('Select at least one payment event')
    expect(results.errorSummaryList[0]).to.have.keys('href', 'text')
    expect(results.errorSummaryList[0].href).to.equal('#callback_url')
    expect(results.errorSummaryList[0].text).to.equal('Enter a callback URL')
  })

  it('correctly validates correct values', () => {
    const validDefaultSchemaForm = new WebhooksForm()
    const validRadioInputs = [ [ 'card_payment_refunded', 'card_payment_captured' ], 'card_payment_refunded' ]

    validRadioInputs.forEach((validRadioInput) => {
      const formData = {
        'callback_url': 'https://a-valid-url.test',
        'subscriptions': validRadioInput
      }
      const results = validDefaultSchemaForm.validate(formData)
        expect(results.errorSummaryList).to.be.empty // eslint-disable-line
      expect(results.values['callback_url']).to.equal('https://a-valid-url.test')
      expect(results.values['subscriptions']).to.deep.equal(validRadioInput)
    })
  })

  it('correctly sets values for an existing webhook', () => {
    const validDefaultSchemaForm = new WebhooksForm()
    const webhook = webhooksFixtures.webhookResponse()
    const form = validDefaultSchemaForm.from(webhook)
    expect(form.values.callback_url).to.equal('https://some-callback-url.com')
    expect(form.values.subscriptions).to.deep.equal([ 'card_payment_captured' ])
  })

  it('parses known error identifiers from the backend', () => {
    const validDefaultSchemaForm = new WebhooksForm()

    const formData = {
      'callback_url': 'https://a-valid-url.com',
      'subscriptions': 'card_payment_succeeded'
    }

    const expectedError = new Error('URL must be on allow list')
    expectedError.errorIdentifier = 'CALLBACK_URL_NOT_ON_ALLOW_LIST'

    const result = validDefaultSchemaForm.parseResponse(expectedError, formData)
    expect(result.errorSummaryList[0].href).to.equal('#callback_url')
    expect(result.errorSummaryList[0].text).to.equal('Callback URL must be approved. Please contact support')
    expect(result.values['callback_url']).to.equal('https://a-valid-url.com')
    expect(result.values['subscriptions']).to.deep.equal('card_payment_succeeded')
  })
})
