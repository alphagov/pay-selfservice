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

describe('The card Types summary view', function () {
  it('should display the manage button', function () {
    const model = _.extend({}, templateData)

    const body = renderTemplate('card-payment-types/summary', model)

    body.should.containSelector('a#payment-types-manage-button')
      .withAttribute('class', 'govuk-button')
      .withAttribute('href', '/card-types/manage-type')
      .withText('Manage')
  })

  it('should display a message stating debit and credit cards are currently accepted', function () {
    const model = _.extend({}, templateData, {
      isAcceptedTypeAll: true,
      isAcceptedTypeDebit: false
    })

    const body = renderTemplate('card-payment-types/summary', model)

    body.should.containSelector('#payment-types-accept-all-types-message')
      .withText('Debit and credit cards are currently accepted')
  })

  it('should display a message stating debit cards only accepted', function () {
    const model = _.extend({}, templateData, {
      isAcceptedTypeAll: false,
      isAcceptedTypeDebit: true
    })

    const body = renderTemplate('card-payment-types/summary', model)

    body.should.containSelector('#payment-types-accept-debit-types-message')
      .withText('Debit cards only accepted')
  })

  it('should grey out unavailable options', function () {
    const model = _.extend({}, templateData)
    model['brands'][0] = _.extend({}, templateData['brands'][0], {
      'available': false,
      'unavailabilityReason': 'Not available'
    })

    const body = renderTemplate('card-payment-types/summary', model)

    body.should.containSelector('#payment-types-visa-brand.govuk-text-grey')

    body.should.containSelector('td.table-data-accept span')
      .withText('Not available')
  })

  it('should display selected options as Yes', function () {
    const model = _.extend({}, templateData)
    model['brands'][0] = _.extend({}, templateData['brands'][0], {
      'available': true,
      'selected': true
    })

    const body = renderTemplate('card-payment-types/summary', model)

    body.should.containSelector('td.table-data-label img')
      .withAttribute('src', '/public/images/visa-color.png')

    body.should.containSelector('span.payment-types-selected')
      .withText('Yes')
  })

  it('should display unselected options as No', function () {
    const model = _.extend({}, templateData)
    model['brands'][0] = _.extend({}, templateData['brands'][0], {
      'available': true,
      'selected': false
    })

    const body = renderTemplate('card-payment-types/summary', model)

    body.should.containSelector('td.table-data-label img')
      .withAttribute('src', '/public/images/visa-color.png')

    body.should.containSelector('span.payment-types-not-selected')
      .withText('No')
  })
})
