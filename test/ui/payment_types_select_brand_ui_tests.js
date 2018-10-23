'use strict'

// NPM dependencies
const path = require('path')

// Local dependencies
const renderTemplate = require(path.join(__dirname, '/../test_helpers/html_assertions.js')).render
const _ = require('lodash')
const {TYPES} = require(path.join(__dirname, '/../../app/controllers/payment_types_controller.js'))

const templateData = {
  acceptedType: TYPES.ALL,
  isAcceptedTypeAll: true,
  isAcceptedTypeDebit: false,
  error: '',
  brands: [{
    'id': 'payment-types-visa-brand',
    'value': 'visa',
    'label': 'Visa',
    'available': true,
    'selected': true
  }],
  permissions: {
    'payment_types_read': true,
    'payment_types_update': true
  }
}

describe('The payment select brand view', () => {
  it('should display the main form elements', () => {
    const model = _.extend({}, templateData)

    const body = renderTemplate('card-payment-types/select_brand', model)

    body.should.containSelector('form#payment-types-card-brand-selection-form')
      .withAttribute('method', 'post')
      .withAttribute('action', '/card-types/manage-brand')

    body.should.containSelector('input#accepted-card-type')
      .withAttribute('name', 'acceptedType')
      .withAttribute('type', 'hidden')
      .withAttribute('value', 'ALL')

    body.should.containSelector('a#payment-types-cancel-link')
      .withAttribute('href', '/card-types/summary')
  })

  it('should display a message stating debit and credit cards have been chosen', () => {
    const model = _.extend({}, templateData, {
      isAcceptedTypeAll: true,
      isAcceptedTypeDebit: false
    })

    const body = renderTemplate('card-payment-types/select_brand', model)

    body.should.containSelector('#payment-types-accept-all-types-message')
      .withText('You have chosen to accept debit and credit cards')
  })

  it('should display a message stating debit cards only have been chosen', () => {
    const model = _.extend({}, templateData, {
      isAcceptedTypeAll: false,
      isAcceptedTypeDebit: true
    })

    const body = renderTemplate('card-payment-types/select_brand', model)

    body.should.containSelector('#payment-types-accept-debit-types-message')
      .withText('You have chosen to only accept debit cards')
  })

  it('should grey out unavailable options', () => {
    const model = _.extend({}, templateData)
    model['brands'][0] = _.extend({}, templateData['brands'][0], {
      'available': false,
      'unavailabilityReason': 'Not available'
    })

    const body = renderTemplate('card-payment-types/select_brand', model)

    body.should.containSelector('tr#payment-types-visa-brand.govuk-text-grey')

    body.should.containSelector('td.table-data-accept span')
      .withText('Not available')
  })

  it('should not grey out available options', () => {
    const model = _.extend({}, templateData)
    model['brands'][0] = _.extend({}, templateData['brands'][0], {
      'available': true
    })

    const body = renderTemplate('card-payment-types/select_brand', model)

    body.should.containSelector('td.table-data-label img')
      .withAttribute('src', '/public/images/visa-color.png')

    body.should.containSelector('input.payment-types-checkbox')
      .withAttribute('type', 'checkbox')
      .withAttribute('name', 'acceptedBrands')
      .withAttribute('value', 'visa')
  })

  it('should display an error when at least one card brand has not been selected', () => {
    const model = _.extend({}, templateData, {
      'error': 'You must choose to accept at least one card brand to continue'
    })

    const body = renderTemplate('card-payment-types/select_brand', model)

    body.should.containSelector('#payment-types-error-message')
      .withText('You must choose to accept at least one card brand to continue')
  })

  it('should not display select brand form without correct permission', () => {
    const templateData = {
      acceptedType: TYPES.ALL,
      isAcceptedTypeAll: true,
      isAcceptedTypeDebit: false,
      error: '',
      brands: {
        'id': 'payment-types-visa-brand',
        'value': 'visa',
        'label': 'Visa',
        'available': true,
        'selected': true
      }
    }
    const model = _.extend({}, templateData)

    const body = renderTemplate('card-payment-types/select_brand', model)

    body.should.not.containSelector('form#payment-types-card-brand-selection-form')
  })
})
